// @ts-nocheck
import { ConvexHttpClient } from "convex/browser";
import { type Context, Elysia, t } from "elysia";
import { config } from "../config/env";
import { encrypt } from "../services/encryption";
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

// Store for PKCE verifiers (in production, use Redis or database)
const codeVerifiers = new Map<
	string,
	{ verifier: string; expiresAt: number }
>();

// Clean up expired verifiers every 5 minutes
setInterval(
	() => {
		const now = Date.now();
		for (const [state, data] of codeVerifiers.entries()) {
			if (data.expiresAt < now) {
				codeVerifiers.delete(state);
			}
		}
	},
	5 * 60 * 1000,
);

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
	.get("/x/authorize", async ({ set }: Context) => {
		const codeVerifier = generateCodeVerifier();
		const codeChallenge = await generateCodeChallenge(codeVerifier);
		const state = crypto.randomUUID();

		// Store verifier for callback (10 minute expiry)
		codeVerifiers.set(state, {
			verifier: codeVerifier,
			expiresAt: Date.now() + 10 * 60 * 1000,
		});

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
			set,
		}: Context & { body: { code: string; state: string } }) => {
			try {
				const { code, state } = body;

				// Verify state and get code verifier
				const stored = codeVerifiers.get(state);
				if (!stored) {
					set.status = 400;
					return {
						success: false,
						error: "Invalid or expired state",
					};
				}
				codeVerifiers.delete(state);

				const redirectUri = `${config.CONVEX_URL}/auth/x/callback`;

				// Exchange code for tokens
				const tokens = await exchangeCodeForTokens({
					code,
					redirectUri,
					codeVerifier: stored.verifier,
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
				return {
					success: false,
					error: "Failed to connect X account",
					details: error instanceof Error ? error.message : "Unknown error",
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
