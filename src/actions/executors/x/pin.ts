import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun } from "./base";

export const pinTweetExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "PIN_TWEET");
	if (dryRunError) {
		return createResult(false, "PIN_TWEET", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const triggerData = context.triggerData as Record<string, unknown>;
		const topPost = triggerData.topPost as { id?: string } | undefined;
		const tweetId = String(config.tweetId || triggerData.tweetId || topPost?.id || "");

		if (!tweetId) {
			return createResult(false, "PIN_TWEET", Date.now() - start, undefined, "No tweet ID provided");
		}

		const result = await xClient.pinTweet(tweetId);
		return createResult(true, "PIN_TWEET", Date.now() - start, { tweetId, pinned: result.pinned });
	} catch (error) {
		return createResult(false, "PIN_TWEET", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to pin tweet");
	}
};
