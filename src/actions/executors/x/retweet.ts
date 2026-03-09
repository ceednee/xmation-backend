import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

export const retweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "RETWEET");
	if (dryRunError) {
		return createResult(false, "RETWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const tweetId = String(config.tweetId || triggerData.tweetId || triggerData.retweetId || "");

		if (!tweetId) {
			return createResult(false, "RETWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.retweet(tweetId) as { data?: { id?: string } };
		return createResult(true, "RETWEET", Date.now() - start, {
			retweetId: result.data?.id,
			originalTweetId: tweetId,
		});
	} catch (error) {
		return createResult(false, "RETWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to retweet");
	}
};
