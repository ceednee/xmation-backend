import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const newFollowerEvaluator: TriggerEvaluator = (config, context) => {
	const newFollowers = context.newFollowers || [];
	const minFollowers = Number(config.minFollowers) || 1;

	if (newFollowers.length < minFollowers) {
		return createResult(false, "NEW_FOLLOWER");
	}

	return createResult(true, "NEW_FOLLOWER", {
		followers: newFollowers,
		count: newFollowers.length,
		latestFollower: newFollowers[0],
	});
};
