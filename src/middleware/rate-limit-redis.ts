import type { Context, Elysia } from "elysia";
import Redis from "ioredis";
import { config } from "../config/env";
import { getClientIP } from "./security";
import { logRateLimit } from "../utils/security-logger";

// Redis client for rate limiting
const redis = new Redis(config.REDIS_URL);

// Rate limit window in seconds
const RATE_LIMIT_WINDOW = 60;

export interface RateLimitOptions {
	max?: number; // Max requests per window
	windowMs?: number; // Window in milliseconds
	keyPrefix?: string; // Redis key prefix
	keyGenerator?: (req: Request) => string; // Custom key generator
	skipSuccessful?: boolean; // Reset on successful requests
}

/**
 * Rate limiting middleware using Redis
 * Supports distributed rate limiting across multiple server instances
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
	const {
		max = 100,
		windowMs = 60000,
		keyPrefix = "ratelimit",
		keyGenerator = (req) => getClientIP(req),
		skipSuccessful = false,
	} = options;

	const windowSeconds = Math.ceil(windowMs / 1000);

	return async (context: Context) => {
		const { request, set } = context;

		// Generate rate limit key
		const key = `${keyPrefix}:${keyGenerator(request)}`;

		try {
			// Increment counter and set expiry
			const current = await redis.incr(key);

			// Set expiry on first request
			if (current === 1) {
				await redis.expire(key, windowSeconds);
			}

			// Get remaining time
			const ttl = await redis.ttl(key);

			// Set rate limit headers
			set.headers["X-RateLimit-Limit"] = String(max);
			set.headers["X-RateLimit-Remaining"] = String(Math.max(0, max - current));
			set.headers["X-RateLimit-Reset"] = String(
				Math.ceil(Date.now() / 1000) + ttl
			);

			// Check if limit exceeded
			if (current > max) {
				logRateLimit(request, keyPrefix);

				set.status = 429; // Too Many Requests
				return {
					error: "Rate limit exceeded",
					code: "RATE_LIMIT_EXCEEDED",
					retryAfter: ttl,
				};
			}
		} catch (error) {
			// Redis failure - fail open (allow request) but log
			console.error("Rate limiting error:", error);
		}
	};
};

/**
 * Decrement rate limit counter (for skipSuccessful option)
 */
export const decrementRateLimit = async (context: Context) => {
	const key = context.store?.rateLimitKey;
	if (key) {
		try {
			await redis.decr(key);
		} catch {
			// Ignore errors
		}
	}
};

/**
 * Strict rate limit for auth endpoints
 * 5 attempts per minute
 */
export const authRateLimit = rateLimit({
	max: 5,
	windowMs: 60000,
	keyPrefix: "ratelimit:auth",
	keyGenerator: (req) => {
		// Use both IP and email (if available) for auth endpoints
		const ip = getClientIP(req);
		// Try to extract email from body (for login attempts)
		return `auth:${ip}`;
	},
});

/**
 * API rate limit for general endpoints
 * 100 requests per minute
 */
export const apiRateLimit = rateLimit({
	max: 100,
	windowMs: 60000,
	keyPrefix: "ratelimit:api",
});

/**
 * Workflow-specific rate limit
 * 60 workflow operations per minute per user
 */
export const workflowRateLimit = rateLimit({
	max: 60,
	windowMs: 60000,
	keyPrefix: "ratelimit:workflow",
	keyGenerator: (req) => {
		const userId = req.headers.get("x-user-id");
		const ip = getClientIP(req);
		return userId ? `workflow:user:${userId}` : `workflow:ip:${ip}`;
	},
});

/**
 * X API proxy rate limit
 * Respects X's rate limits (300 per 15 minutes)
 */
export const xApiRateLimit = rateLimit({
	max: 300,
	windowMs: 15 * 60 * 1000, // 15 minutes
	keyPrefix: "ratelimit:xapi",
	keyGenerator: (req) => {
		const xUserId = req.headers.get("x-x-user-id");
		const ip = getClientIP(req);
		return xUserId ? `xapi:user:${xUserId}` : `xapi:ip:${ip}`;
	},
});

/**
 * Abuse prevention: Max workflows per user check
 */
export const checkWorkflowLimit = async (userId: string): Promise<boolean> => {
	const key = `abuse:workflows:${userId}`;
	const count = await redis.incr(key);

	if (count === 1) {
		// Set expiry to 24 hours
		await redis.expire(key, 24 * 60 * 60);
	}

	// Max 50 workflows per user per day
	return count <= 50;
};

/**
 * Abuse prevention: Daily action limit
 */
export const checkDailyActionLimit = async (
	userId: string,
	action: string
): Promise<{ allowed: boolean; remaining: number }> => {
	const key = `abuse:actions:${userId}:${action}:${new Date().toISOString().split("T")[0]}`;
	const count = await redis.incr(key);

	if (count === 1) {
		// Expire at end of day
		await redis.expire(key, 24 * 60 * 60);
	}

	const limits: Record<string, number> = {
		follow: 400, // X's follow limit per day
		tweet: 200, // X's tweet limit per hour (conservative)
		like: 1000,
		dm: 1000,
		default: 1000,
	};

	const limit = limits[action] || limits.default;

	return {
		allowed: count <= limit,
		remaining: Math.max(0, limit - count),
	};
};

/**
 * Clean up Redis connection on shutdown
 */
process.on("SIGTERM", () => {
	redis.disconnect();
});

process.on("SIGINT", () => {
	redis.disconnect();
});
