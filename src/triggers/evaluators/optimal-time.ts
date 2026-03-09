import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const optimalPostTimeEvaluator: TriggerEvaluator = (config, context) => {
	const optimalHours: number[] = Array.isArray(config.optimalHours)
		? (config.optimalHours as number[])
		: [9, 12, 17];
	const timezone = config.timezone || "UTC";
	const currentTime = context.currentTime || Date.now();
	const now = new Date(currentTime);
	const currentHour = now.getUTCHours();

	const isOptimalTime = optimalHours.some((hour: number) => {
		const diff = Math.abs(currentHour - hour);
		return diff <= 0.5 || diff >= 23.5;
	});

	if (!isOptimalTime) {
		return createResult(false, "OPTIMAL_POST_TIME");
	}

	return createResult(true, "OPTIMAL_POST_TIME", {
		currentHour,
		optimalHours,
		timezone,
	});
};
