import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const unfollowDetectedEvaluator: TriggerEvaluator = (_config, context) => {
	const followers = context.followers || [];
	const unfollows = followers.filter((f) => f.action === "unfollow");

	if (unfollows.length === 0) {
		return createResult(false, "UNFOLLOW_DETECTED");
	}

	return createResult(true, "UNFOLLOW_DETECTED", {
		unfollows,
		count: unfollows.length,
		recentUnfollows: unfollows.slice(0, 10),
	});
};
