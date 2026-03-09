import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const contentGapEvaluator: TriggerEvaluator = (config, context) => {
	const gapThreshold = Number(config.gapHours) || 24;
	const lastPostTime = context.lastPostTime || 0;

	if (lastPostTime === 0) {
		return createResult(true, "CONTENT_GAP", {
			hoursSinceLastPost: null,
			message: "No posts yet",
		});
	}

	const hoursSinceLastPost =
		((context.currentTime || Date.now()) - lastPostTime) / (60 * 60 * 1000);

	if (hoursSinceLastPost > gapThreshold) {
		return createResult(true, "CONTENT_GAP", {
			hoursSinceLastPost: Math.floor(hoursSinceLastPost),
			lastPostTime,
		});
	}

	return createResult(false, "CONTENT_GAP");
};
