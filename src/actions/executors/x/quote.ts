import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun } from "./base";

export const quoteTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "QUOTE_TWEET");
	if (dryRunError) {
		return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const comment = replaceTemplates(String(config.comment ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(config.tweetId || triggerData.tweetId || "");

		if (!tweetId) {
			return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.quoteTweet(tweetId, comment);
		return createResult(true, "QUOTE_TWEET", Date.now() - start, {
			quoteId: result.data?.id,
			comment,
			originalTweetId: tweetId,
		});
	} catch (error) {
		return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to quote tweet");
	}
};
