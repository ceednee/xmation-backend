/**
 * X Action Executor Base Utilities
 * 
 * Shared utilities for X (Twitter) action executors including:
 * - Result creation helpers
 * - Template variable replacement
 * - X API client access
 * - Dry-run mode checking
 * - ID extraction from config/trigger data
 */

import type { ActionContext } from "../../types";
import { createResult, replaceTemplates } from "../../utils";
import { getXClient, checkDryRun } from "../../x-client";

// Re-export utilities for use in action executors
export { createResult, replaceTemplates, getXClient, checkDryRun };
export type { ActionContext };

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
