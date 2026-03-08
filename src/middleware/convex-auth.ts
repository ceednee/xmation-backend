import { ConvexHttpClient } from "convex/browser";
import type { Context } from "elysia";
import { config } from "../config/env";
import { decrypt } from "../services/encryption";
import { logFailedAuth } from "../utils/security-logger";
import { apiRateLimit } from "./rate-limit-redis";

// Convex HTTP client for server-side queries
const convex = new ConvexHttpClient(config.CONVEX_URL);

export interface AuthenticatedUser {
	id: string;
	email?: string;
	name?: string;
	xUserId?: string;
	xUsername?: string;
	xAccessToken?: string; // Decrypted
	xRefreshToken?: string; // Decrypted
	xTokenExpiresAt?: number;
	profile?: {
		displayName: string;
		avatarUrl: string;
		bio: string;
		followersCount: number;
		followingCount: number;
		verified: boolean;
	};
}

/**
 * Verify Convex Auth session token
 */
export async function verifyConvexSession(
	token: string,
): Promise<AuthenticatedUser | null> {
	try {
		// Call Convex to verify session
		// Note: In production, you'd use Convex Auth's session verification
		// For now, we'll use a simple approach

		// Get user with X connection from Convex
		const result = (await convex.query(
			api.users.getCurrentWithX as never,
			{ token } as never,
		)) as ConvexUser | null;

		if (!result) {
			return null;
		}

		const user: AuthenticatedUser = {
			id: result._id,
			email: result.email,
			name: result.name,
			xUserId: result.xUserId,
			xUsername: result.xUsername,
			profile: result.profile,
		};

		// If user has X connection, decrypt tokens
		if (result.xConnected) {
			const tokens = (await convex.query(
				api.users.getXTokens as never,
				{ token } as never,
			)) as XTokens | null;

			if (tokens) {
				try {
					user.xAccessToken = decrypt(tokens.xAccessToken);
					user.xRefreshToken = decrypt(tokens.xRefreshToken);
					user.xTokenExpiresAt = tokens.xTokenExpiresAt;
				} catch (e) {
					console.error("Failed to decrypt X tokens:", e);
					return null;
				}
			}
		}

		return user;
	} catch (error) {
		console.error("Session verification failed:", error);
		return null;
	}
}

/**
 * Middleware: Require Convex Auth session
 */
export const requireConvexAuth =
	() =>
	async ({ request, set }: Context) => {
		const authHeader = request.headers.get("authorization");

		if (!authHeader) {
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "NO_TOKEN",
				message: "Authorization header required",
			};
		}

		const token = authHeader.replace("Bearer ", "");

		if (!authHeader.startsWith("Bearer ") || !token) {
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "INVALID_FORMAT",
				message: "Authorization header must be 'Bearer <token>'",
			};
		}

		// Verify with Convex
		const user = await verifyConvexSession(token);

		if (!user) {
			logFailedAuth(request, "invalid_session");
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "INVALID_SESSION",
				message: "Invalid or expired session",
			};
		}

		// User authenticated successfully
		// Store user in request headers for downstream use (Elysia pattern)
		request.headers.set("x-user-id", user.id);
		if (user.xUserId) {
			request.headers.set("x-x-user-id", user.xUserId);
		}
	};

/**
 * Middleware: Require X OAuth connection
 */
export const requireXConnection =
	() =>
	async ({ request, set }: Context) => {
		// Get user ID from request header (set by requireConvexAuth)
		const userId = request.headers.get("x-user-id");

		if (!userId) {
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "NO_USER",
				message: "User not authenticated",
			};
		}

		// Check for X connection via header
		const xUserId = request.headers.get("x-x-user-id");
		if (!xUserId) {
			set.status = 403;
			return {
				error: "X account required",
				code: "X_NOT_CONNECTED",
				message: "You must connect your X account to use this feature",
				action: "/auth/x/connect",
			};
		}
	};

/**
 * Combined middleware for protected routes
 * Includes rate limiting, auth, and X connection check
 */
export const protectedRoute = () => {
	const rateLimiter = apiRateLimit;
	const auth = requireConvexAuth();
	const xCheck = requireXConnection();

	return async (context: Context) => {
		// Check rate limit first
		const rateResult = await rateLimiter(context);
		if (rateResult) return rateResult;

		// Check auth
		const authResult = await auth(context);
		if (authResult) return authResult;

		// Check X connection
		const xResult = await xCheck(context);
		if (xResult) return xResult;
	};
};

// Import api for Convex queries
import { api } from "../../convex/_generated/api";

// Extend Convex user result type
interface ConvexUser {
	_id: string;
	email?: string;
	name?: string;
	xConnected?: boolean;
	xUserId?: string;
	xUsername?: string;
	profile?: {
		displayName: string;
		avatarUrl: string;
		bio: string;
		followersCount: number;
		followingCount: number;
		verified: boolean;
	};
	preferences?: {
		timezone: string;
		dryRunDefault: boolean;
		notificationsEnabled: boolean;
	};
}

interface XTokens {
	xAccessToken: string;
	xRefreshToken: string;
	xTokenExpiresAt: number;
}
