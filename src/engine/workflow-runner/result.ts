/**
 * Workflow Execution Result Utilities
 * 
 * Helper functions and classes for creating and building workflow execution results.
 * Provides factories for various result types and a builder class for complex results.
 * 
 * @module workflow-runner/result
 */

import type { Workflow, ActionConfig } from "../../types";
import type { WorkflowExecutionResult, ExecutionState } from "./types";

/**
 * Create an error result for a failed workflow execution.
 * 
 * @param workflowId - The ID of the workflow
 * @param userId - The owner of the workflow
 * @param isDryRun - Whether the execution was in dry run mode
 * @param error - The error message
 * @param startedAt - The timestamp when execution started
 * @returns A failed workflow execution result
 */
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

/**
 * Create a paused result for a workflow that cannot run due to paused status.
 * 
 * @param workflowId - The ID of the workflow
 * @param userId - The owner of the workflow
 * @param isDryRun - Whether the execution was in dry run mode
 * @param startedAt - The timestamp when execution started
 * @returns A paused workflow execution result
 */
export const createPausedResult = (workflowId: string, userId: string, isDryRun: boolean, startedAt: number) =>
	createErrorResult(workflowId, userId, isDryRun, "Workflow is paused", startedAt);

/**
 * Create a draft result for a workflow that cannot run due to draft status.
 * 
 * @param workflowId - The ID of the workflow
 * @param userId - The owner of the workflow
 * @param isDryRun - Whether the execution was in dry run mode
 * @param startedAt - The timestamp when execution started
 * @returns A draft workflow execution result
 */
export const createDraftResult = (workflowId: string, userId: string, isDryRun: boolean, startedAt: number) =>
	createErrorResult(workflowId, userId, isDryRun, "Workflow is in draft mode", startedAt);

/**
 * @deprecated Use createPausedResult instead
 */
export const buildPausedResult = (workflow: Workflow, startedAt: number) =>
	createPausedResult(workflow._id, workflow.userId, workflow.isDryRun, startedAt);

/**
 * @deprecated Use createDraftResult instead
 */
export const buildDraftResult = (workflow: Workflow, startedAt: number) =>
	createDraftResult(workflow._id, workflow.userId, workflow.isDryRun, startedAt);

/**
 * Determine the execution status based on action results.
 * 
 * @param actionsFailed - Number of actions that failed
 * @param actionsExecuted - Number of actions that were executed
 * @returns The status: "completed" if no failures, "failed" if all failed, "partial" otherwise
 */
export const determineStatus = (actionsFailed: number, actionsExecuted: number): "completed" | "failed" | "partial" => {
	if (actionsFailed === 0) return "completed";
	if (actionsExecuted === 0) return "failed";
	return "partial";
};

/**
 * Create a success result for a completed workflow execution.
 * 
 * @param workflowId - The ID of the workflow
 * @param userId - The owner of the workflow
 * @param mode - The execution mode (live or dry_run)
 * @param state - The final execution state
 * @param startedAt - The timestamp when execution started
 * @param triggerData - The data that triggered the workflow
 * @returns A successful/partial workflow execution result
 */
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

/**
 * Builder class for constructing workflow execution results.
 * 
 * The ResultBuilder provides a clean interface for creating workflow
 * execution results from the final execution state.
 * 
 * @example
 * ```typescript
 * const builder = new ResultBuilder();
 * const result = builder.build(workflow, executionState, startedAt, triggerData);
 * ```
 */
export class ResultBuilder {
	/**
	 * Build a workflow execution result from the execution state.
	 * 
	 * Determines whether to create an error result or success result
	 * based on the execution state. Error results are created when
	 * there are errors but no actions were successfully executed.
	 * 
	 * @param workflow - The workflow that was executed
	 * @param execution - The final execution state
	 * @param startedAt - The timestamp when execution started
	 * @param triggerData - The data that triggered the workflow
	 * @returns The complete workflow execution result
	 */
	build(
		workflow: Workflow,
		execution: ExecutionState,
		startedAt: number,
		triggerData: Record<string, unknown>,
	): WorkflowExecutionResult {
		const mode = workflow.isDryRun ? "dry_run" : "live";
		
		if (execution.hasErrors && execution.actionsExecuted === 0) {
			return createErrorResult(
				workflow._id,
				workflow.userId,
				workflow.isDryRun,
				execution.firstError || "Execution failed",
				startedAt,
			);
		}
		
		return createSuccessResult(
			workflow._id,
			workflow.userId,
			mode,
			execution,
			startedAt,
			triggerData,
		);
	}
}
