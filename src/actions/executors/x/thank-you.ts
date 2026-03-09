import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

const THANK_YOU_MESSAGES = ["Thanks!", "Thank you!", "Appreciate it!", "Thanks for the support!"];

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

		const result = await xClient.replyToTweet(tweetId, text);
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
