import type { TriggerResult, TriggerEvaluator } from "../types";

export type { TriggerResult, TriggerEvaluator };

export const createResult = (
	triggered: boolean,
	triggerType: string,
	data?: Record<string, unknown>,
): TriggerResult => ({
	triggered,
	triggerType,
	data,
	timestamp: Date.now(),
});
