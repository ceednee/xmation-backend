/**
 * X API Client Factory
 * 
 * Provides X (Twitter) API client instances for action executors.
 * Switches between mock client (dry-run) and real client (live mode).
 * 
 * ## Modes
 * 
 * - **Dry Run**: Returns mock client that simulates API calls
 * - **Live Mode**: Returns real client using X OAuth tokens from Convex
 * 
 * ## Token Flow
 * 
 * 1. Fetch encrypted tokens from Convex (user's stored X OAuth tokens)
 * 2. Decrypt tokens using AES-256-GCM
 * 3. Check expiration, refresh if needed (< 5 min remaining)
 * 4. Create real X API client with valid access token
 * 
 * ## Usage
 * 
 * ```typescript
 * const xClient = await getXClient(context);
 * const result = await xClient.replyToTweet(tweetId, text);
 * 
 * if (result.success) {
 *   console.log("Success:", result.data);
 * } else {
 *   console.error("Failed:", result.error);
 * }
 * ```
 * 
 * ## Rate Limits
 * 
 * Free tier limits apply:
 * - Post tweets: 500/month
 * - Likes: 1000/day
 * - Retweets: 1000/day
 * - Follows: 400/day
 * - DMs: 1000/day
 */

import type { ActionContext, XApiClient } from "./types";
import { createMockXClient } from "./mock-client";
import { createRealXClient } from "./real-client";
import { xTokenService, XTokenError } from "../services/x-token";

/**
 * Get X API client instance
 * 
 * Returns mock client for dry-run mode, real client for live mode.
 * Real client requires valid X OAuth tokens stored in Convex.
 * 
 * @param context - Action execution context with userId and dryRun flag
 * @returns XApiClient (mock or real based on dryRun)
 * @throws XTokenError if live mode requested but no valid tokens available
 * 
 * @example
 * ```typescript
 * // Dry run (mock)
 * const mockClient = await getXClient({ userId: "u1", dryRun: true, ... });
 * 
 * // Live mode (real API calls)
 * const realClient = await getXClient({ userId: "u1", dryRun: false, ... });
 * ```
 */
export const getXClient = async (context: ActionContext): Promise<XApiClient> => {
	// Always return mock client in dry-run mode
	if (context.dryRun) {
		return createMockXClient();
	}

	// Live mode: Get real tokens and create real client
	try {
		const tokens = await xTokenService.getValidTokens(context.userId);
		
		// Get user's X ID from trigger data or context
		// This is needed for endpoints like /2/users/:id/likes
		const xUserId = context.xUserId || String(context.triggerData?.xUserId || "");
		
		if (!xUserId) {
			console.warn("[X API] xUserId not available in context, some operations may fail");
		}

		console.log(`[X API] Creating real client for user ${context.userId}`);
		return createRealXClient(tokens.accessToken, xUserId || "me");
	} catch (error) {
		if (error instanceof XTokenError) {
			console.error(`[X API] Token error: ${error.message}`);
			throw error;
		}
		
		// Unexpected error, wrap it
		throw new XTokenError(
			"Failed to initialize X API client",
			"CLIENT_INIT_FAILED",
			error instanceof Error ? error : undefined,
		);
	}
};

/**
 * Check if action can execute in current mode
 * 
 * This function validates that the required conditions are met
 * for the action to execute. In dry-run mode, always returns null
 * (proceed). In live mode, verifies X connection exists.
 * 
 * @param context - Action execution context
 * @param actionType - Type of action being executed (for error messages)
 * @returns Error message if cannot proceed, null if can proceed
 * 
 * @example
 * ```typescript
 * const error = checkDryRun(context, "CREATE_POST");
 * if (error) {
 *   return { success: false, error };
 * }
 * // Proceed with action...
 * ```
 */
export const checkDryRun = (context: ActionContext, actionType: string): string | null => {
	// Dry-run mode always OK
	if (context.dryRun) {
		return null;
	}

	// Live mode: Check if user has X connection
	// This is a lightweight check - the actual token validation
	// happens in getXClient()
	if (!context.xUserId && !context.triggerData?.xUserId) {
		return `${actionType} requires X connection - no xUserId available`;
	}

	// Can proceed with live execution
	return null;
};

/**
 * Check if user has valid X connection
 * 
 * Lightweight check to verify X tokens exist before attempting
 * to use them. Useful for pre-flight checks.
 * 
 * @param userId - User ID to check
 * @returns True if user has valid X connection
 */
export const hasXConnection = async (userId: string): Promise<boolean> => {
	try {
		await xTokenService.getValidTokens(userId);
		return true;
	} catch {
		return false;
	}
};

// Re-export XTokenError for error handling
export { XTokenError } from "../services/x-token";
