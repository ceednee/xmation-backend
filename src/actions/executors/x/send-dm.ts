/**
 * Action: SEND_DM
 * 
 * Sends a direct message (DM) to a user on X (Twitter).
 * Supports template variable substitution in the message text.
 * 
 * ## Configuration
 * - `text` (required) - The DM text content
 * - `userId` (optional) - Recipient X user ID
 *   - If not provided, uses authorId or followerId from trigger data
 * 
 * ## Template Variables
 * - `{{authorUsername}}` - Username of the message recipient
 * - `{{followerUsername}}` - Username of new follower
 * - Other trigger data fields can be referenced
 * 
 * ## Context Data
 * - `triggerData.authorId` - Recipient ID (from mentions/replies)
 * - `triggerData.followerId` - Recipient ID (from new follower trigger)
 * 
 * ## Example
 * ```typescript
 * const config = {
 *   text: "Hi @{{authorUsername}}, thanks for reaching out!"
 * };
 * const result = await sendDMExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun } from "./base";

/**
 * Executes SEND_DM action
 * Sends a direct message to the specified user
 * 
 * @param config - Action configuration with text and optional userId
 * @param context - Action execution context
 * @returns Action result with DM details
 */
export const sendDMExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "SEND_DM");
	if (dryRunError) {
		return createResult(false, "SEND_DM", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const text = replaceTemplates(String(config.text ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(config.userId || triggerData.authorId || triggerData.followerId || "");

		if (!userId) {
			return createResult(false, "SEND_DM", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.sendDM(userId, text) as { data?: { id?: string } };
		return createResult(true, "SEND_DM", Date.now() - start, {
			dmId: result.data?.id,
			text,
			recipientId: userId,
		});
	} catch (error) {
		return createResult(false, "SEND_DM", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to send DM");
	}
};
