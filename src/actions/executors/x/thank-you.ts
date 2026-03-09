/**
 * Action: THANK_YOU_REPLY
 * 
 * Automatically sends a thank you reply to engagement (mentions, retweets, likes).
 * Cycles through a list of pre-defined thank you messages.
 * 
 * ## Configuration
 * - `text` (optional) - Custom thank you message
 *   - If not provided, randomly selects from default messages:
 *     - "Thanks!"
 *     - "Thank you!"
 *     - "Appreciate it!"
 *     - "Thanks for the support!"
 * 
 * ## Context Data
 * - `triggerData.tweetId` - Tweet ID to reply to
 * - `triggerData.mentionId` - Alternative tweet ID source
 * 
 * ## Trigger
 * Best used with triggers:
 * - `MENTION` - When someone mentions your account
 * - `RETWEET_OF_YOU` - When someone retweets your content
 * 
 * ## Example
 * ```typescript
 * // Use random default message
 * const config = {};
 * const result = await thankYouReplyExecutor(config, context);
 * 
 * // Or use custom message
 * const config2 = { text: "Thanks so much for the support! 🙏" };
 * const result2 = await thankYouReplyExecutor(config2, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

/** Default thank you messages used when no custom text provided */
const THANK_YOU_MESSAGES = ["Thanks!", "Thank you!", "Appreciate it!", "Thanks for the support!"];

/**
 * Executes THANK_YOU_REPLY action
 * Sends a thank you reply to the triggering tweet
 * 
 * @param config - Action configuration with optional custom text
 * @param context - Action execution context
 * @returns Action result with reply details
 */
export const thankYouReplyExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "THANK_YOU_REPLY");
	if (dryRunError) {
		return createResult(false, "THANK_YOU_REPLY", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const text = String(config.text || THANK_YOU_MESSAGES[Math.floor(Math.random() * THANK_YOU_MESSAGES.length)]);
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(triggerData.tweetId || triggerData.mentionId || "");

		if (!tweetId) {
			return createResult(false, "THANK_YOU_REPLY", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.replyToTweet(tweetId, text) as { data?: { id?: string } };
		return createResult(true, "THANK_YOU_REPLY", Date.now() - start, {
			replyId: result.data?.id,
			text,
			repliedTo: tweetId,
		});
	} catch (error) {
		return createResult(false, "THANK_YOU_REPLY", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to send thank you");
	}
};
