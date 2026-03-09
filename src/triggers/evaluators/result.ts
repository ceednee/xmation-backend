import type { TriggerResult } from "../types";

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
