/**
 * Sync Result Helpers
 * 
 * Factory functions for creating standardized sync results.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Success result
 * const result = createSuccessResult(10, { mentions: [...] });
 * 
 * // Error result
 * const error = createErrorResult("API request failed");
 * 
 * // In-progress result
 * const inProgress = createInProgressResult();
 * 
 * // Rate limit result
 * const rateLimit = createRateLimitResult();
 * ```
 */

import type { SyncResult } from "./types";

/**
 * Create a successful sync result
 * 
 * @param count - Number of items synced
 * @param data - Additional result data
 * @returns SyncResult object
 */
export const createSuccessResult = (count: number, data?: Partial<SyncResult>): SyncResult => ({
	success: true,
	count,
	...data,
});

/**
 * Create an error sync result
 * 
 * @param error - Error message
 * @returns SyncResult object
 */
export const createErrorResult = (error: string): SyncResult => ({
	success: false,
	count: 0,
	error,
});

/**
 * Create an in-progress result (when sync is already running)
 * 
 * @returns SyncResult object
 */
export const createInProgressResult = (): SyncResult =>
	createErrorResult("Sync already in progress");

/**
 * Create a rate limit exceeded result
 * 
 * @returns SyncResult object
 */
export const createRateLimitResult = (): SyncResult =>
	createErrorResult("Rate limit exceeded");
