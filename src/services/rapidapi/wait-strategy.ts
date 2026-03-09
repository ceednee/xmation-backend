/**
 * Rate Limit Wait Strategy
 * 
 * Implements waiting strategies when rate limits are hit.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Wait only if rate limited (with max 60s cap)
 * await waitIfRateLimited();
 * 
 * // Wait for full reset time
 * await waitForRateLimit();
 * ```
 */

import { getRemaining, getResetTime } from "./rate-limit-store";

/**
 * Calculate wait time until rate limit reset
 * 
 * @returns Milliseconds to wait (0 if no wait needed)
 */
const calculateWaitTime = (): number => {
	const waitTime = getResetTime() - Date.now();
	return Math.max(0, waitTime);
};

/**
 * Wait if rate limited, with a maximum wait cap
 * 
 * Waits up to 60 seconds maximum to prevent indefinite blocking.
 * Logs warning when waiting.
 */
export const waitIfRateLimited = async (): Promise<void> => {
	if (getRemaining() > 0) return;

	const waitTime = calculateWaitTime();
	if (waitTime > 0) {
		console.warn(`Rate limit hit, waiting ${Math.ceil(waitTime / 1000)}s`);
		await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 60000)));
	}
};

/**
 * Wait for rate limit to reset
 * 
 * Waits the full reset time (no cap). Use for controlled backoff.
 */
export const waitForRateLimit = async (): Promise<void> => {
	if (getRemaining() > 0) return;

	const waitTime = calculateWaitTime();
	if (waitTime > 0) {
		console.log(`Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset...`);
		await new Promise((resolve) => setTimeout(resolve, waitTime));
	}
};
