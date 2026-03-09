/**
 * Execution History Tracking
 * 
 * Manages the history of workflow executions for debugging and monitoring.
 * Maintains a limited-size history per workflow to prevent memory issues.
 * 
 * @module workflow-runner/history
 */

import type { WorkflowExecutionResult } from "./types";

/** Maximum number of execution results to keep per workflow */
const MAX_HISTORY_SIZE = 100;

/**
 * Manages execution history for workflows.
 * 
 * The ExecutionHistory class maintains a record of workflow executions,
 * automatically limiting the history size per workflow to prevent
 * unbounded memory growth.
 * 
 * @example
 * ```typescript
 * const history = new ExecutionHistory();
 * 
 * // Log an execution
 * history.log(workflowId, result);
 * 
 * // Retrieve history
 * const results = history.get(workflowId);
 * console.log(`Last execution: ${results[results.length - 1]}`);
 * ```
 */
export class ExecutionHistory {
	private executionLog: Map<string, WorkflowExecutionResult[]> = new Map();

	/**
	 * Get execution history for a workflow.
	 * 
	 * Returns an empty array if no history exists for the workflow.
	 * 
	 * @param workflowId - The ID of the workflow
	 * @returns Array of execution results, oldest first
	 */
	get(workflowId: string): WorkflowExecutionResult[] {
		return this.executionLog.get(workflowId) || [];
	}

	/**
	 * Log a workflow execution result.
	 * 
	 * Adds the result to the workflow's history. If the history exceeds
	 * MAX_HISTORY_SIZE, the oldest result is removed.
	 * 
	 * @param workflowId - The ID of the workflow
	 * @param result - The execution result to log
	 */
	log(workflowId: string, result: WorkflowExecutionResult): void {
		const history = this.get(workflowId);
		history.push(result);

		if (history.length > MAX_HISTORY_SIZE) {
			history.shift();
		}

		this.executionLog.set(workflowId, history);
	}
}
