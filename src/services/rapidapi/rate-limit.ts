/**
 * Rate Limit Manager
 * 
 * Handles rate limit tracking from API response headers.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Update from response headers
 * updateRateLimitFromHeaders(response.headers);
 * 
 * // Check if we can make requests
 * if (canMakeRequest()) {
 *   await makeApiCall();
 * }
 * 
 * // Wait for rate limit reset
 * await waitForRateLimit();
 * 
 * // Get current status
 * const status = getRateLimitStatus();
 * console.log(status.remaining);
 * ```
 */

import { rateLimitStatus, updateRateLimit, getRateLimitStatus } from "./rate-limit-store";

/**
 * Update rate limit info from API response headers
 * 
 * @param headers - Response headers from fetch
 */
export const updateRateLimitFromHeaders = (headers: Headers): void => {
	const remaining = headers.get("x-ratelimit-requests-remaining");
	const reset = headers.get("x-ratelimit-requests-reset");

	if (remaining && reset) {
		updateRateLimit(
			Number.parseInt(remaining, 10),
			Number.parseInt(reset, 10) * 1000
		);
	}
};

export { getRateLimitStatus };

/**
 * Check if a request can be made without hitting rate limit
 * 
 * @returns true if requests remain or reset time has passed
 */
export const canMakeRequest = (): boolean => {
	return rateLimitStatus.remaining > 0 || Date.now() >= rateLimitStatus.resetTime;
};

/**
 * Get wait time until rate limit resets
 * 
 * @returns Milliseconds to wait (0 if no wait needed)
 */
export const getWaitTime = (): number => {
	const waitTime = rateLimitStatus.resetTime - Date.now();
	return Math.max(0, waitTime);
};

/**
 * Wait for rate limit to reset if exhausted
 * 
 * Logs wait time to console.
 */
export const waitForRateLimit = async (): Promise<void> => {
	if (rateLimitStatus.remaining > 0) return;

	const waitTime = getWaitTime();
	if (waitTime > 0) {
		console.log(`Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset...`);
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}
};
