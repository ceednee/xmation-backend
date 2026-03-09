import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const postRepostedEvaluator: TriggerEvaluator = (_config, context) => {
	const retweets = context.retweets || [];
	const newRetweets = retweets.filter(
		(r) => r.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	if (newRetweets.length === 0) {
		return createResult(false, "POST_REPOSTED");
	}

	return createResult(true, "POST_REPOSTED", {
		retweets: newRetweets,
		count: newRetweets.length,
		latestRetweet: newRetweets[0],
	});
};
