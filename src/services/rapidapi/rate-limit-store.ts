/**
 * Rate Limit Store
 * 
 * In-memory store for rate limit status.
 * Tracks remaining requests and reset time.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Update rate limit info
 * updateRateLimit(45, Date.now() + 60000);
 * 
 * // Get current status
 * const status = getRateLimitStatus();
 * console.log(status.remaining, status.resetTime);
 * 
 * // Quick accessors
 * const remaining = getRemaining();
 * const resetTime = getResetTime();
 * ```
 */

/** Rate limit status structure */
interface RateLimitStatus {
	remaining: number;
	resetTime: number;
	limit: number;
}

/** Current rate limit status */
export const rateLimitStatus: RateLimitStatus = {
	remaining: 100,
	resetTime: Date.now() + 60000,
	limit: 100,
};

/**
 * Update rate limit values
 * 
 * @param remaining - Remaining requests
 * @param resetTime - Reset timestamp in milliseconds
 */
export const updateRateLimit = (remaining: number, resetTime: number): void => {
	rateLimitStatus.remaining = remaining;
	rateLimitStatus.resetTime = resetTime;
};

/**
 * Get current rate limit status (copy)
 * 
 * @returns Current status object
 */
export const getRateLimitStatus = (): RateLimitStatus => ({ ...rateLimitStatus });

/**
 * Get remaining requests
 * 
 * @returns Number of remaining requests
 */
export const getRemaining = (): number => rateLimitStatus.remaining;

/**
 * Get rate limit reset time
 * 
 * @returns Reset timestamp in milliseconds
 */
export const getResetTime = (): number => rateLimitStatus.resetTime;
