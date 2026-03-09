/**
 * X API Rate Limiting Service
 * 
 * Tracks and enforces X API rate limits per user.
 * X API v2 has strict limits that vary by endpoint and tier.
 * 
 * ## Rate Limits (Free Tier)
 * 
 * | Endpoint | Limit | Window |
 * |----------|-------|--------|
 * | POST /2/tweets | 500 | Per month |
 * | POST /2/users/:id/likes | 1000 | Per day |
 * | POST /2/users/:id/retweets | 1000 | Per day |
 * | POST /2/users/:id/following | 400 | Per day |
 * | POST /2/dm_conversations | 1000 | Per day |
 * 
 * ## Usage
 * 
 * ```typescript
 * const limiter = new XRateLimiter();
 * 
 * // Check if action allowed
 * const allowed = await limiter.checkLimit(userId, "CREATE_POST");
 * if (!allowed.allowed) {
 *   return { error: `Rate limit exceeded. Reset at ${allowed.resetTime}` };
 * }
 * 
 * // Record usage after successful API call
 * await limiter.recordUsage(userId, "CREATE_POST");
 * ```
 */

import { incr, expire, sadd, get } from "./cache";

/**
 * Rate limit configuration for each action type
 */
interface RateLimitConfig {
	limit: number;
	window: "month" | "day" | "hour";
	windowMs: number;
}

/**
 * Current rate limit status
 */
export interface RateLimitStatus {
	allowed: boolean;
	remaining: number;
	limit: number;
	resetTime: number;
	window: string;
}

/**
 * Action types that consume rate limits
 */
export type RateLimitedAction =
	| "CREATE_POST"
	| "LIKE_TWEET"
	| "RETWEET"
	| "FOLLOW_USER"
	| "SEND_DM"
	| "REPLY_TO_TWEET"
	| "QUOTE_TWEET"
	| "PIN_TWEET"
	| "BLOCK_USER"
	| "ADD_TO_LIST";

/**
 * Rate limit configurations
 * 
 * Based on X API v2 Free tier limits.
 * Adjust these if using Basic ($100/mo) or Pro ($5k/mo) tiers.
 */
const RATE_LIMITS: Record<RateLimitedAction, RateLimitConfig> = {
	// Posts - 500/month (most restrictive)
	CREATE_POST: { limit: 500, window: "month", windowMs: 30 * 24 * 60 * 60 * 1000 },
	REPLY_TO_TWEET: { limit: 500, window: "month", windowMs: 30 * 24 * 60 * 60 * 1000 },
	QUOTE_TWEET: { limit: 500, window: "month", windowMs: 30 * 24 * 60 * 60 * 1000 },

	// Engagement - 1000/day
	LIKE_TWEET: { limit: 1000, window: "day", windowMs: 24 * 60 * 60 * 1000 },
	RETWEET: { limit: 1000, window: "day", windowMs: 24 * 60 * 60 * 1000 },
	PIN_TWEET: { limit: 1000, window: "day", windowMs: 24 * 60 * 60 * 1000 },

	// Social - 400/day
	FOLLOW_USER: { limit: 400, window: "day", windowMs: 24 * 60 * 60 * 1000 },
	BLOCK_USER: { limit: 400, window: "day", windowMs: 24 * 60 * 60 * 1000 },
	ADD_TO_LIST: { limit: 400, window: "day", windowMs: 24 * 60 * 60 * 1000 },

	// Messages - 1000/day
	SEND_DM: { limit: 1000, window: "day", windowMs: 24 * 60 * 60 * 1000 },
};

/**
 * Rate limit error
 */
export class RateLimitExceededError extends Error {
	constructor(
		message: string,
		public readonly action: RateLimitedAction,
		public readonly resetTime: number,
	) {
		super(message);
		this.name = "RateLimitExceededError";
	}
}

/**
 * X API Rate Limiter
 * 
 * Manages rate limits for X API calls per user.
 * Uses Redis/cache for distributed rate limit tracking.
 */
export class XRateLimiter {
	/**
	 * Get cache key for rate limit tracking
	 */
	private getKey(userId: string, action: RateLimitedAction): string {
		const config = RATE_LIMITS[action];
		const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
		return `x_rate_limit:${userId}:${action}:${windowStart}`;
	}

	/**
	 * Check if action is within rate limit
	 * 
	 * @param userId - User making the request
	 * @param action - Type of action
	 * @returns Rate limit status
	 */
	async checkLimit(
		userId: string,
		action: RateLimitedAction,
	): Promise<RateLimitStatus> {
		const config = RATE_LIMITS[action];
		const key = this.getKey(userId, action);

		try {
			// Get current count from cache
			const countValue = await get<number>(key);
			const count = countValue ?? 0;

			// Calculate reset time
			const windowStart = Math.floor(Date.now() / config.windowMs) * config.windowMs;
			const resetTime = windowStart + config.windowMs;

			const remaining = Math.max(0, config.limit - count);
			const allowed = count < config.limit;

			return {
				allowed,
				remaining,
				limit: config.limit,
				resetTime,
				window: config.window,
			};
		} catch (error) {
			// If cache fails, be permissive but log error
			console.error(`[X Rate Limit] Cache error for ${key}:`, error);
			return {
				allowed: true,
				remaining: config.limit,
				limit: config.limit,
				resetTime: Date.now() + config.windowMs,
				window: config.window,
			};
		}
	}

	/**
	 * Record usage of an action
	 * 
	 * @param userId - User making the request
	 * @param action - Type of action
	 */
	async recordUsage(userId: string, action: RateLimitedAction): Promise<void> {
		const config = RATE_LIMITS[action];
		const key = this.getKey(userId, action);

		try {
			// Increment counter
			const newCount = await incr(key);

			// Set expiry on first increment
			if (newCount === 1) {
				await expire(key, Math.ceil(config.windowMs / 1000));
			}

			// Also record to analytics
			await this.recordAnalytics(userId, action);
		} catch (error) {
			console.error(`[X Rate Limit] Failed to record usage for ${key}:`, error);
		}
	}

	/**
	 * Check and consume rate limit in one operation
	 * 
	 * @param userId - User making the request
	 * @param action - Type of action
	 * @returns True if allowed and consumed
	 * @throws RateLimitExceededError if limit exceeded
	 */
	async consume(
		userId: string,
		action: RateLimitedAction,
	): Promise<RateLimitStatus> {
		const status = await this.checkLimit(userId, action);

		if (!status.allowed) {
			throw new RateLimitExceededError(
				`Rate limit exceeded for ${action}. Resets at ${new Date(status.resetTime).toISOString()}`,
				action,
				status.resetTime,
			);
		}

		await this.recordUsage(userId, action);
		return status;
	}

	/**
	 * Get rate limit status for all actions
	 * 
	 * @param userId - User to check
	 * @returns Map of action to status
	 */
	async getAllLimits(
		userId: string,
	): Promise<Record<RateLimitedAction, RateLimitStatus>> {
		const actions = Object.keys(RATE_LIMITS) as RateLimitedAction[];
		const results = await Promise.all(
			actions.map(async (action) => ({
				action,
				status: await this.checkLimit(userId, action),
			})),
		);

		return results.reduce(
			(acc, { action, status }) => {
				acc[action] = status;
				return acc;
			},
			{} as Record<RateLimitedAction, RateLimitStatus>,
		);
	}

	/**
	 * Record usage to analytics
	 */
	private async recordAnalytics(
		userId: string,
		action: RateLimitedAction,
	): Promise<void> {
		// Fire and forget analytics recording
		const analyticsKey = `x_api_usage:${userId}:${new Date().toISOString().split("T")[0]}`;
		const analyticsValue = `${action}:${Date.now()}`;
		try {
			await sadd(analyticsKey, analyticsValue);
			await expire(analyticsKey, 30 * 24 * 60 * 60); // Keep 30 days
		} catch {
			// Analytics failures are non-critical
		}
	}
}

/**
 * Singleton instance
 */
export const xRateLimiter = new XRateLimiter();

/**
 * Map action types to rate limit categories
 */
export function getRateLimitAction(actionType: string): RateLimitedAction | null {
	const mapping: Record<string, RateLimitedAction> = {
		CREATE_POST: "CREATE_POST",
		REPLY_TO_TWEET: "REPLY_TO_TWEET",
		QUOTE_TWEET: "QUOTE_TWEET",
		LIKE_TWEET: "LIKE_TWEET",
		RETWEET: "RETWEET",
		PIN_TWEET: "PIN_TWEET",
		FOLLOW_USER: "FOLLOW_USER",
		FOLLOW_BACK: "FOLLOW_USER",
		BLOCK_USER: "BLOCK_USER",
		ADD_TO_LIST: "ADD_TO_LIST",
		SEND_DM: "SEND_DM",
		WELCOME_DM: "SEND_DM",
		THANK_YOU_REPLY: "REPLY_TO_TWEET",
	};

	return mapping[actionType] || null;
}
