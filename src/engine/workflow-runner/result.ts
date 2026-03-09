import type { WorkflowExecutionResult, ExecutionState } from "./types";

export const createErrorResult = (
	workflowId: string,
	userId: string,
	isDryRun: boolean,
	error: string,
	startedAt: number
): WorkflowExecutionResult => ({
	success: false,
	workflowId,
	userId,
	status: "failed",
	mode: isDryRun ? "dry_run" : "live",
	actionsExecuted: 0,
	actionsFailed: 0,
	logs: [error],
	error,
	startedAt,
	completedAt: Date.now(),
});

export const createPausedResult = (workflowId: string, userId: string, isDryRun: boolean, startedAt: number) =>
	createErrorResult(workflowId, userId, isDryRun, "Workflow is paused", startedAt);

export const createDraftResult = (workflowId: string, userId: string, isDryRun: boolean, startedAt: number) =>
	createErrorResult(workflowId, userId, isDryRun, "Workflow is in draft mode", startedAt);

export const determineStatus = (actionsFailed: number, actionsExecuted: number): "completed" | "failed" | "partial" => {
	if (actionsFailed === 0) return "completed";
	if (actionsExecuted === 0) return "failed";
	return "partial";
};

export const createSuccessResult = (
	workflowId: string,
	userId: string,
	mode: "live" | "dry_run",
	state: ExecutionState,
	startedAt: number,
	triggerData: Record<string, unknown>
): WorkflowExecutionResult => ({
	success: !state.hasErrors || state.actionsExecuted > 0,
	workflowId,
	userId,
	status: determineStatus(state.actionsFailed, state.actionsExecuted),
	mode,
	actionsExecuted: state.actionsExecuted,
	actionsFailed: state.actionsFailed,
	logs: state.logs,
	error: state.firstError,
	startedAt,
	completedAt: Date.now(),
	context: triggerData,
});
