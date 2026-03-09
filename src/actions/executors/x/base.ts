/**
 * X Action Executor Base Utilities
 * 
 * Shared utilities for X (Twitter) action executors including:
 * - Result creation helpers
 * - Template variable replacement
 * - X API client access
 * - Dry-run mode checking
 * - Rate limit enforcement
 * - ID extraction from config/trigger data
 */

import type { ActionContext, ActionResult } from "../../types";
import { createResult, replaceTemplates } from "../../utils";
import { getXClient, checkDryRun } from "../../x-client";
import { xRateLimiter, getRateLimitAction, RateLimitExceededError } from "../../../services/x-rate-limit";

// Re-export utilities for use in action executors
export { createResult, replaceTemplates, getXClient, checkDryRun };
export type { ActionContext };

/**
 * Execute X API action with rate limiting
 * 
 * Wraps X API calls with rate limit checking and error handling.
 * Records usage after successful calls.
 * 
 * @param context - Action context
 * @param actionType - Type of X action
 * @param apiCall - Function that performs the API call
 * @returns Action result
 */
export async function executeWithRateLimit<T>(
	context: ActionContext,
	actionType: string,
	apiCall: () => Promise<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
	// Check rate limit (skip in dry-run)
	if (!context.dryRun) {
		const rateLimitAction = getRateLimitAction(actionType);
		if (rateLimitAction) {
			try {
				await xRateLimiter.consume(context.userId, rateLimitAction);
			} catch (error) {
				if (error instanceof RateLimitExceededError) {
					const resetDate = new Date(error.resetTime);
					return {
						success: false,
						error: `X API rate limit exceeded for ${actionType}. Resets at ${resetDate.toLocaleString()}`,
					};
				}
				throw error;
			}
		}
	}

	try {
		const result = await apiCall();
		return { success: true, data: result };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "X API call failed",
		};
	}
}

/**
 * Build standardized error result for X action failures
 * 
 * @param actionType - Type of action
 * @param error - Error message or object
 * @returns ActionResult with error details
 */
export function buildXActionError(
	actionType: string,
	error: string | Error,
): ActionResult {
	const errorMessage = error instanceof Error ? error.message : error;
	return {
		success: false,
		actionType,
		error: errorMessage,
		executionTimeMs: 0,
	};
}

/**
 * Extract tweet ID from action config or trigger data
 * Checks config.tweetId first, then trigger data fields
 * 
 * @param config - Action configuration
 * @param triggerData - Trigger event data
 * @returns Tweet ID or empty string if not found
 */
export const getTweetId = (config: Record<string, unknown>, triggerData: Record<string, unknown>): string => {
	return String(config.tweetId || triggerData.tweetId || triggerData.mentionId || "");
};

/**
 * Extract user ID from action config or trigger data
 * Checks config.userId first, then trigger data fields
 * 
 * @param config - Action configuration
 * @param triggerData - Trigger event data
 * @returns User ID or empty string if not found
 */
export const getUserId = (config: Record<string, unknown>, triggerData: Record<string, unknown>): string => {
	return String(config.userId || triggerData.authorId || "");
};
