// @ts-nocheck
import { ConvexHttpClient } from "convex/browser";
import { type Context, Elysia, t } from "elysia";
import Redis from "ioredis";
import { config } from "../config/env";
import { encrypt } from "../services/encryption";
import { createHash, randomBytes } from "crypto";
import { authRateLimit } from "../middleware/rate-limit-redis";
import { logFailedAuth, logSuccessfulAuth, logTokenEvent } from "../utils/security-logger";
import {
	exchangeCodeForTokens,
	generateAuthUrl,
	generateCodeChallenge,
	generateCodeVerifier,
	getXUserProfile,
	refreshAccessToken,
	revokeTokens,
} from "../services/x-oauth";

const convex = new ConvexHttpClient(config.CONVEX_URL);

// PKCE storage with Redis + in-memory fallback
const redis = new Redis(config.REDIS_URL, {
	connectTimeout: 5000,
	maxRetriesPerRequest: 1,
	lazyConnect: true,
});

// Track Redis availability
let redisAvailable = false;
redis.connect().then(() => {
	redisAvailable = true;
}).catch(() => {
	redisAvailable = false;
});

// In-memory fallback for tests
const codeVerifiers = new Map<string, { verifier: string; expiresAt: number }>();
const oauthStates = new Map<string, { sessionId: string; expiresAt: number }>();

// PKCE verifier TTL in seconds (10 minutes)
const PKCE_TTL = 600;

// OAuth state TTL in seconds (10 minutes)
const STATE_TTL = 600;

// Helper to store PKCE verifier
const storePKCE = async (state: string, verifier: string): Promise<void> => {
	if (redisAvailable) {
		try {
			await redis.setex(`pkce:${state}`, PKCE_TTL, verifier);
			return;
		} catch {
			// Fall through to memory
		}
	}
	// In-memory fallback
	codeVerifiers.set(state, {
		verifier,
		expiresAt: Date.now() + PKCE_TTL * 1000,
	});
};

// Helper to get PKCE verifier
const getPKCE = async (state: string): Promise<string | null> => {
	if (redisAvailable) {
		try {
			const verifier = await redis.get(`pkce:${state}`);
			if (verifier) {
				await redis.del(`pkce:${state}`);
				return verifier;
			}
		} catch {
			// Fall through to memory
		}
	}
	// In-memory fallback
	const stored = codeVerifiers.get(state);
	if (stored && stored.expiresAt > Date.now()) {
		codeVerifiers.delete(state);
		return stored.verifier;
	}
	codeVerifiers.delete(state);
	return null;
};

// Clean up expired verifiers and states periodically (memory fallback only)
setInterval(() => {
	const now = Date.now();
	for (const [state, data] of codeVerifiers.entries()) {
		if (data.expiresAt < now) {
			codeVerifiers.delete(state);
		}
	}
	for (const [state, data] of oauthStates.entries()) {
		if (data.expiresAt < now) {
			oauthStates.delete(state);
		}
	}
}, 5 * 60 * 1000);

// CSRF State helpers with session binding
const generateSecureState = (sessionId: string): string => {
	const randomPart = randomBytes(16).toString("hex");
	const sessionHash = createHash("sha256")
		.update(sessionId)
		.digest("hex")
		.slice(0, 16);
	return `${randomPart}.${sessionHash}`;
};

const validateSecureState = (state: string, sessionId: string): boolean => {
	const parts = state.split(".");
	if (parts.length !== 2) return false;
	const [, sessionHash] = parts;
	const expectedHash = createHash("sha256")
		.update(sessionId)
		.digest("hex")
		.slice(0, 16);
	return sessionHash === expectedHash;
};

const storeOAuthState = async (state: string, sessionId: string): Promise<void> => {
	if (redisAvailable) {
		try {
			await redis.setex(`oauth:state:${state}`, STATE_TTL, sessionId);
			return;
		} catch {
			// Fall through to memory
		}
	}
	oauthStates.set(state, {
		sessionId,
		expiresAt: Date.now() + STATE_TTL * 1000,
	});
};

const verifyOAuthState = async (state: string, sessionId: string): Promise<boolean> => {
	// First check session binding cryptographically
	if (!validateSecureState(state, sessionId)) {
		return false;
	}

	// Then check if state exists and hasn't been used
	if (redisAvailable) {
		try {
			const storedSessionId = await redis.get(`oauth:state:${state}`);
			if (storedSessionId === sessionId) {
				await redis.del(`oauth:state:${state}`); // One-time use
				return true;
			}
			return false;
		} catch {
			// Fall through to memory
		}
	}
	// In-memory fallback
	const stored = oauthStates.get(state);
	if (stored && stored.sessionId === sessionId && stored.expiresAt > Date.now()) {
		oauthStates.delete(state); // One-time use
		return true;
	}
	return false;
};

/**
 * Auth routes for X OAuth
 */
export const authRoutes = new Elysia({ prefix: "/auth" })
	// GET /auth/status - Check auth status
	.get("/status", async ({ request }: Context) => {
		const authHeader = request.headers.get("authorization");

		if (!authHeader) {
			return {
				authenticated: false,
				xConnected: false,
			};
		}

		try {
			// Get user from Convex with X connection status
			const user = await convex.query(api.users.getCurrentWithX, {
				token: authHeader.replace("Bearer ", ""),
			});

			if (!user) {
				return {
					authenticated: false,
					xConnected: false,
				};
			}

			return {
				authenticated: true,
				xConnected: user.xConnected,
				user: {
					id: user._id,
					email: user.email,
					name: user.name,
					xUsername: user.xUsername,
				},
			};
		} catch {
			return {
				authenticated: false,
				xConnected: false,
			};
		}
	})

	// GET /auth/x/authorize - Initiate X OAuth with PKCE
	.get("/x/authorize", async ({ request, set }: Context) => {
		// Get session ID from request (header or cookie)
		const sessionId = request.headers.get("x-session-id") || crypto.randomUUID();
		
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		
		// Generate CSRF-protected state bound to session
		const state = generateSecureState(sessionId);

		// Store verifier and state
		await storePKCE(state, codeVerifier);
		await storeOAuthState(state, sessionId);

		const redirectUri = `${config.CONVEX_URL}/auth/x/callback`;

		const authUrl = await generateAuthUrl({
			redirectUri,
			state,
			codeChallenge,
		});

		set.status = 302;
		set.headers.Location = authUrl;

		return {
			message: "Redirecting to X OAuth",
			redirectUrl: authUrl,
		};
	})

	// POST /auth/x/callback - Handle X OAuth callback
	.post(
		"/x/callback",
		async ({
			body,
			request,
			set,
		}: Context & { body: { code: string; state: string }; request: Request }) => {
			try {
				const { code, state } = body;
				
				// Get session ID from request
				const sessionId = request.headers.get("x-session-id");
				if (!sessionId) {
					set.status = 400;
					return {
						success: false,
						error: "Session ID required for CSRF protection",
						code: "MISSING_SESSION",
					};
				}

				// Verify CSRF state (cryptographically bound to session)
				const isValidState = await verifyOAuthState(state, sessionId);
				if (!isValidState) {
					set.status = 403;
					return {
						success: false,
						error: "Invalid or expired state - possible CSRF attack",
						code: "CSRF_VALIDATION_FAILED",
					};
				}

				// Get code verifier
				const codeVerifier = await getPKCE(state);
				if (!codeVerifier) {
					set.status = 400;
					return {
						success: false,
						error: "Code verifier expired or invalid",
						code: "INVALID_VERIFIER",
					};
				}

				const redirectUri = `${config.CONVEX_URL}/auth/x/callback`;

				// Exchange code for tokens
				const tokens = await exchangeCodeForTokens({
					code,
					redirectUri,
					codeVerifier,
				});

				// Get user profile from X
				const profile = await getXUserProfile(tokens.access_token);

				// Encrypt tokens before storing
				const encryptedAccessToken = encrypt(tokens.access_token);
				const encryptedRefreshToken = encrypt(tokens.refresh_token);

				// Store in Convex
				await convex.mutation(api.users.storeXTokens, {
					xUserId: profile.id,
					xUsername: profile.username,
					xAccessToken: encryptedAccessToken,
					xRefreshToken: encryptedRefreshToken,
					xTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
					xScopes: tokens.scope?.split(" ") || [],
					profile: {
						displayName: profile.name,
						avatarUrl: profile.profile_image_url,
						bio: profile.description || "",
						followersCount: profile.public_metrics?.followers_count || 0,
						followingCount: profile.public_metrics?.following_count || 0,
						verified: profile.verified || false,
					},
				});

				logSuccessfulAuth(request, profile.id);

				return {
					success: true,
					message: "X account connected successfully",
					user: {
						xUserId: profile.id,
						xUsername: profile.username,
						displayName: profile.name,
					},
				};
			} catch (error) {
				console.error("OAuth callback error:", error);
				set.status = 500;
				// Sanitized error - don't expose internal details
				return {
					success: false,
					error: "Failed to connect X account",
					code: "OAUTH_ERROR",
				};
			}
		},
		{
			body: t.Object({
				code: t.String(),
				state: t.String(),
			}),
		},
	)

	// POST /auth/x/refresh - Refresh X access token
	.post("/x/refresh", async ({ request, set }: Context) => {
		const authHeader = request.headers.get("authorization");
		if (!authHeader) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		try {
			// Get user's refresh token from Convex
			const user = await convex.query(api.users.getXTokens, {
				token: authHeader.replace("Bearer ", ""),
			});

			if (!user?.xRefreshToken) {
				set.status = 400;
				return { error: "No X connection found" };
			}

			// Refresh token
			const newTokens = await refreshAccessToken(user.xRefreshToken);

			// Encrypt and store new tokens
			const encryptedAccessToken = encrypt(newTokens.access_token);
			const encryptedRefreshToken = encrypt(newTokens.refresh_token);

			await convex.mutation(
				api.users.updateXTokens as never,
				{
					xAccessToken: encryptedAccessToken,
					xRefreshToken: encryptedRefreshToken,
					xTokenExpiresAt: Date.now() + newTokens.expires_in * 1000,
				} as never,
			);

			return {
				success: true,
				message: "Token refreshed",
			};
		} catch (error) {
			console.error("Token refresh error:", error);
			set.status = 500;
			return {
				error: "Failed to refresh token",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	})

	// POST /auth/x/disconnect - Disconnect X account
	.post("/x/disconnect", async ({ request, set }: Context) => {
		const authHeader = request.headers.get("authorization");
		if (!authHeader) {
			set.status = 401;
			return { error: "Unauthorized" };
		}

		try {
			// Get user's tokens from Convex
			const user = await convex.query(api.users.getXTokens, {
				token: authHeader.replace("Bearer ", ""),
			});

			if (user?.xAccessToken) {
				// Revoke tokens at X
				await revokeTokens(user.xAccessToken);
			}

			// Remove X connection from Convex
			await convex.mutation(api.users.disconnectX, {
				token: authHeader.replace("Bearer ", ""),
			});

			logTokenEvent("token_revoke", user?.userId || "unknown");

			return {
				success: true,
				message: "X account disconnected",
			};
		} catch (error) {
			console.error("Disconnect error:", error);
			// Still return success even if revoke fails
			return {
				success: true,
				message: "X account disconnected (token revoke may have failed)",
			};
		}
	})

	// GET /auth/me - Get current user info
	.get("/me", async ({ request, set }: Context) => {
		const authHeader = request.headers.get("authorization");

		if (!authHeader) {
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "NO_TOKEN",
			};
		}

		try {
			// Get user from Convex
			const user = await convex.query(api.users.getCurrentWithX, {
				token: authHeader.replace("Bearer ", ""),
			});

			if (!user) {
				set.status = 401;
				return {
					error: "Unauthorized",
					code: "USER_NOT_FOUND",
				};
			}

			return {
				success: true,
				data: {
					id: user._id,
					email: user.email,
					name: user.name,
					xConnected: user.xConnected,
					xUsername: user.xUsername,
					xUserId: user.xUserId,
					profile: user.profile,
				},
			};
		} catch (error) {
			console.error("Get user error:", error);
			set.status = 500;
			return {
				error: "Failed to get user",
				details: error instanceof Error ? error.message : "Unknown error",
			};
		}
	});

// Import api for type checking
import { api } from "../../convex/_generated/api";

export default authRoutes;
