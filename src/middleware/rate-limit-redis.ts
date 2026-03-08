import type { Context } from "elysia";
import Redis from "ioredis";
import { config } from "../config/env";
import { getClientIP } from "./security";
import { logRateLimit } from "../utils/security-logger";

// Redis client for rate limiting with connection timeout
const redis = new Redis(config.REDIS_URL, {
	connectTimeout: 5000, // 5 second connection timeout
	maxRetriesPerRequest: 1,
	lazyConnect: true, // Don't connect immediately
	retryStrategy: () => null, // Don't retry - fail fast
});

// Track Redis connection state
let redisAvailable = false;

// Attach error handler BEFORE connecting to catch all errors
redis.on("error", (err) => {
	// Silently ignore connection errors - we handle them via redisAvailable flag
	redisAvailable = false;
});

// Try to connect to Redis (non-blocking)
redis.connect().then(() => {
	redisAvailable = true;
	console.log("✅ Redis connected for rate limiting");
}).catch(() => {
	redisAvailable = false;
	console.warn("⚠️ Redis not available - rate limiting will use memory fallback");
});

// Rate limit window in seconds
const RATE_LIMIT_WINDOW = 60;

// In-memory fallback for when Redis is unavailable (per-process only)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitOptions {
	max?: number; // Max requests per window
	windowMs?: number; // Window in milliseconds
	keyPrefix?: string; // Redis key prefix
	keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Rate limiting middleware using Redis with in-memory fallback
 * Supports distributed rate limiting across multiple server instances
 */
export const rateLimit = (options: RateLimitOptions = {}) => {
	const {
		max = 100,
		windowMs = 60000,
		keyPrefix = "ratelimit",
		keyGenerator = (req) => getClientIP(req),
	} = options;

	const windowSeconds = Math.ceil(windowMs / 1000);

	return async (context: Context) => {
		const { request, set } = context;

		// Generate rate limit key
		const key = `${keyPrefix}:${keyGenerator(request)}`;

		// Use Redis if available, otherwise fall back to memory
		if (redisAvailable) {
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
				// Redis failure - fall back to memory
				console.warn("Redis rate limit failed, using memory fallback");
				return memoryRateLimit(context, key, max, windowMs);
			}
		} else {
			// Use memory fallback
			return memoryRateLimit(context, key, max, windowMs);
		}
	};
};

/**
 * In-memory rate limiting fallback
 */
const memoryRateLimit = (
	context: Context,
	key: string,
	max: number,
	windowMs: number
) => {
	const { set } = context;
	
	// Ensure headers object exists (for test mocks)
	if (!set.headers) {
		set.headers = {};
	}
	
	const now = Date.now();
	const record = memoryStore.get(key);

	// Reset if window has passed
	if (!record || now > record.resetTime) {
		memoryStore.set(key, { count: 1, resetTime: now + windowMs });
		set.headers["X-RateLimit-Limit"] = String(max);
		set.headers["X-RateLimit-Remaining"] = String(max - 1);
		set.headers["X-RateLimit-Reset"] = String(Math.ceil((now + windowMs) / 1000));
		return;
	}

	// Increment count
	record.count++;

	if (record.count > max) {
		const retryAfter = Math.ceil((record.resetTime - now) / 1000);
		set.status = 429;
		set.headers["X-RateLimit-Reset"] = String(Math.ceil(record.resetTime / 1000));
		return {
			error: "Rate limit exceeded",
			code: "RATE_LIMIT_EXCEEDED",
			retryAfter,
		};
	}

	set.headers["X-RateLimit-Limit"] = String(max);
	set.headers["X-RateLimit-Remaining"] = String(max - record.count);
	set.headers["X-RateLimit-Reset"] = String(Math.ceil(record.resetTime / 1000));
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
		const ip = getClientIP(req);
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
	if (!redisAvailable) return true; // Skip if Redis unavailable

	const key = `abuse:workflows:${userId}`;
	try {
		const count = await redis.incr(key);

		if (count === 1) {
			// Set expiry to 24 hours
			await redis.expire(key, 24 * 60 * 60);
		}

		// Max 50 workflows per user per day
		return count <= 50;
	} catch {
		return true; // Fail open
	}
};

/**
 * Abuse prevention: Daily action limit
 */
export const checkDailyActionLimit = async (
	userId: string,
	action: string
): Promise<{ allowed: boolean; remaining: number }> => {
	const limits: Record<string, number> = {
		follow: 400, // X's follow limit per day
		tweet: 200, // X's tweet limit per hour (conservative)
		like: 1000,
		dm: 1000,
		default: 1000,
	};

	const limit = limits[action] || limits.default;

	if (!redisAvailable) {
		return { allowed: true, remaining: limit };
	}

	const key = `abuse:actions:${userId}:${action}:${new Date().toISOString().split("T")[0]}`;
	try {
		const count = await redis.incr(key);

		if (count === 1) {
			// Expire at end of day
			await redis.expire(key, 24 * 60 * 60);
		}

		return {
			allowed: count <= limit,
			remaining: Math.max(0, limit - count),
		};
	} catch {
		return { allowed: true, remaining: limit };
	}
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
