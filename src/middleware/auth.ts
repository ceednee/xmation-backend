import { type Context, Elysia } from "elysia";

// Simple in-memory rate limiting (replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export interface AuthContext {
	user?: {
		id: string;
		xUserId?: string;
		xUsername?: string;
	};
}

/**
 * Middleware: Require authentication (valid Bearer token)
 */
export const requireAuth =
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

		// ⚠️ SECURITY: Token must be verified with Convex Auth
		// The old implementation only checked length - this is INSECURE
		// as any 10+ character string would bypass authentication
		
		// For now, we require the token to be present and properly formatted
		// Real verification requires Convex Auth integration
		// See: https://docs.convex.dev/auth
		
		if (!token || token.length === 0) {
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "INVALID_TOKEN",
				message: "Token is required",
			};
		}
		
		// TODO: Implement actual Convex token verification
		// - Parse JWT and verify signature
		// - Check token expiry
		// - Verify with Convex Auth provider
		// - Store validated user in context
		
		// Token format validation (basic JWT structure check)
		const jwtParts = token.split(".");
		if (jwtParts.length !== 3) {
			set.status = 401;
			return {
				error: "Unauthorized",
				code: "INVALID_TOKEN_FORMAT",
				message: "Token must be in JWT format (header.payload.signature)",
			};
		}
	};

/**
 * Middleware: Require X OAuth connection
 */
export const requireXConnection =
	() =>
	async ({ request, set }: Context) => {
		// TODO: Check if user has X OAuth connected in database
		// For now, we'll check a header for testing
		const xConnected = request.headers.get("x-x-connected") === "true";

		if (!xConnected) {
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
 * Middleware: Rate limiting
 */
interface RateLimitOptions {
	max?: number;
	windowMs?: number;
	keyGenerator?: (req: Request) => string;
}

export const rateLimit = (options: RateLimitOptions = {}) => {
	const { max = 100, windowMs = 60000, keyGenerator } = options;

	return async ({ request, set }: Context) => {
		const key = keyGenerator
			? keyGenerator(request)
			: request.headers.get("x-user-id") ||
				request.headers.get("x-forwarded-for") ||
				"anonymous";

		const now = Date.now();
		const record = rateLimitStore.get(key);

		// Reset if window has passed
		if (!record || now > record.resetTime) {
			rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
			set.headers["x-rate-limit-remaining"] = String(max - 1);
			set.headers["x-rate-limit-reset"] = String(now + windowMs);
			return;
		}

		// Increment count
		record.count++;

		if (record.count > max) {
			set.status = 429;
			set.headers["x-rate-limit-reset"] = String(record.resetTime);
			return {
				error: "Rate limit exceeded",
				code: "RATE_LIMIT_EXCEEDED",
				retryAfter: Math.ceil((record.resetTime - now) / 1000),
			};
		}

		set.headers["x-rate-limit-remaining"] = String(max - record.count);
		set.headers["x-rate-limit-reset"] = String(record.resetTime);
	};
};

/**
 * Combined auth middleware for protected routes
 */
export const protectedRoute = () => {
	const auth = requireAuth();
	const xCheck = requireXConnection();
	const rateLimiter = rateLimit({ max: 100, windowMs: 60000 });

	return async (context: Context) => {
		// Check auth
		const authResult = await auth(context);
		if (authResult) return authResult;

		// Check rate limit
		const rateResult = await rateLimiter(context);
		if (rateResult) return rateResult;

		// Check X connection
		const xResult = await xCheck(context);
		if (xResult) return xResult;
	};
};
