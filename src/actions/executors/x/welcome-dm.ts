/**
 * Action: WELCOME_DM
 * 
 * Sends a welcome direct message to new followers on X (Twitter).
 * Supports template variable substitution in the message text.
 * 
 * ## Configuration
 * - `message` (optional) - Custom welcome message
 *   - Defaults to "Welcome! Thanks for following!"
 *   - Supports template variables
 * 
 * ## Template Variables
 * - `{{followerUsername}}` - Username of the new follower
 * - Other trigger data fields can be referenced
 * 
 * ## Context Data
 * - `triggerData.followerId` (required) - ID of the new follower
 * 
 * ## Trigger
 * Must be used with trigger:
 * - `NEW_FOLLOWER` - When someone follows your account
 * 
 * ## Example
 * ```typescript
 * const config = { 
 *   message: "Hey @{{followerUsername}}! Welcome to the community! 🎉" 
 * };
 * const result = await welcomeDMExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun } from "./base";

/**
 * Executes WELCOME_DM action
 * Sends a welcome DM to the new follower
 * 
 * @param config - Action configuration with optional custom message
 * @param context - Action execution context with followerId in triggerData
 * @returns Action result with DM details
 */
export const welcomeDMExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "WELCOME_DM");
	if (dryRunError) {
		return createResult(false, "WELCOME_DM", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const message = replaceTemplates(String(config.message || "Welcome! Thanks for following!"), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(triggerData.followerId || "");

		if (!userId) {
			return createResult(false, "WELCOME_DM", Date.now() - start, undefined, "No follower ID provided");
		}

		const result = await xClient.sendDM(userId, message) as { data?: { id?: string } };
		return createResult(true, "WELCOME_DM", Date.now() - start, {
			dmId: result.data?.id,
			message,
			recipientId: userId,
		});
	} catch (error) {
		return createResult(false, "WELCOME_DM", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to send welcome DM");
	}
};
