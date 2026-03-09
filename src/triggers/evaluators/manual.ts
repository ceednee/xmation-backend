import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const manualTriggerEvaluator: TriggerEvaluator = (_config, context) => {
	if (!context.manualTrigger) {
		return createResult(false, "MANUAL_TRIGGER");
	}

	return createResult(true, "MANUAL_TRIGGER", {
		triggeredAt: context.currentTime || Date.now(),
		triggeredBy: context.userId,
	});
};
