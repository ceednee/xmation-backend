import type { ActionExecutionResult } from "./types";

export const createSuccessResult = (
	actionType: string,
	actionId: string,
	output: Record<string, unknown>,
	executionTime: number,
	dryRun = false
): ActionExecutionResult => ({
	success: true,
	actionType,
	actionId,
	output,
	dryRun,
	executionTime,
	completedAt: Date.now(),
});

export const createErrorResult = (
	actionType: string,
	actionId: string,
	error: string,
	executionTime: number,
	retryAfter?: number
): ActionExecutionResult => ({
	success: false,
	actionType,
	actionId,
	error,
	retryAfter,
	executionTime,
	completedAt: Date.now(),
});
