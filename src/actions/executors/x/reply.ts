import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun, getTweetId } from "./base";

export const replyToTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "REPLY_TO_TWEET");
	if (dryRunError) {
		return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const text = replaceTemplates(String(config.text ?? ""), context);
		const tweetId = getTweetId(config, context.triggerData as Record<string, unknown>);

		if (!tweetId) {
			return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.replyToTweet(tweetId, text);
		return createResult(true, "REPLY_TO_TWEET", Date.now() - start, {
			tweetId: result.data?.id,
			text,
			repliedTo: tweetId,
		});
	} catch (error) {
		return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to reply");
	}
};
