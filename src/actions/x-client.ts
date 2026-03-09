/**
 * X API Client Factory
 * 
 * Provides X (Twitter) API client instances for action executors.
 * Currently uses mock client since X OAuth is not implemented.
 * 
 * ## Modes
 * 
 * - **Dry Run**: Returns mock client that simulates API calls
 * - **Live Mode**: Currently returns mock client (OAuth not implemented)
 * 
 * ## Usage
 * 
 * ```typescript
 * const xClient = await getXClient(context);
 * const result = await xClient.replyToTweet(tweetId, text);
 * ```
 */

import type { ActionContext, XApiClient } from "./types";
import { createMockXClient } from "./mock-client";

/**
 * Get X API client instance
 * Returns mock client for dry-run or if OAuth not available
 * 
 * @param context - Action execution context
 * @returns X API client (currently always mock)
 */
export const getXClient = async (context: ActionContext): Promise<XApiClient> => {
	if (context.dryRun) {
		return createMockXClient();
	}
	console.log("[X API] Live mode requested but X OAuth not implemented, using mock");
	return createMockXClient();
};

/**
 * Check if action can execute in current mode
 * Returns error message if live mode requested (not implemented)
 * 
 * @param context - Action execution context
 * @param actionType - Type of action being executed
 * @returns Error message or null if can proceed
 */
export const checkDryRun = (context: ActionContext, actionType: string): string | null => {
	if (!context.dryRun) {
		return `${actionType} not implemented - dry run only`;
	}
	return null;
};
