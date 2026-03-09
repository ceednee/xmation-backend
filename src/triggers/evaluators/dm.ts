import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const newDMEvaluator: TriggerEvaluator = (_config, context) => {
	const dms = context.dms || [];
	const newDMs = dms.filter(
		(dm) => dm.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	if (newDMs.length === 0) {
		return createResult(false, "NEW_DM");
	}

	return createResult(true, "NEW_DM", {
		dms: newDMs,
		count: newDMs.length,
		latestDM: newDMs[0],
	});
};
