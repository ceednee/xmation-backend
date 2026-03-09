import type { ActionResult } from "../types";

export const createResult = (
	success: boolean,
	actionType: string,
	executionTimeMs: number,
	output?: Record<string, unknown>,
	error?: string,
): ActionResult => ({
	success,
	actionType,
	output,
	error,
	executionTimeMs,
});
