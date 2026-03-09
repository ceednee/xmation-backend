/**
 * Workflow Runner
 * 
 * Executes workflows by running their actions in sequence.
 * 
 * ## Responsibilities
 * 
 * - Validate workflow status before execution
 * - Build execution context for actions
 * - Execute actions sequentially
 * - Track execution history
 * - Handle delays between actions
 * - Aggregate results
 * 
 * ## Execution Flow
 * 
 * ```
 * execute(workflow, triggerData)
 *   ↓
 * Check Status ──paused?──→ Return paused result
 *   ↓ draft?      ↓
 *   ↓       Return draft result
 *   ↓ active
 *   ↓
 * Build Context
 *   ↓
 * Execute Actions ──each action──→ Build result
 *   ↓
 * Log History
 *   ↓
 * Return Result
 * ```
 * 
 * ## Action Context
 * 
 * Each action receives:
 * - `userId`: Workflow owner
 * - `workflowId`: Current workflow
 * - `runId`: Unique execution ID
 * - `triggerData`: Data that triggered the workflow
 * - `previousResults`: Results from prior actions
 * - `dryRun`: Whether to simulate execution
 * 
 * @example
 * ```typescript
 * const runner = new WorkflowRunner();
 * 
 * const result = await runner.execute(workflow, {
 *   mentionId: "123",
 *   text: "@user hello"
 * });
 * 
 * console.log(result.success);           // true/false
 * console.log(result.actionsExecuted);   // number
 * console.log(result.error);             // error message if failed
 * ```
 */

import type { Workflow } from "../../types";
import type { WorkflowExecutionResult, ExecutionContext } from "./types";
import { executeActions } from "./executor";
import { buildPausedResult, buildDraftResult } from "./result";
import { ExecutionHistory } from "./history";
import { ResultBuilder } from "./result";

export class WorkflowRunner {
	private executionLog: Map<string, WorkflowExecutionResult[]> = new Map();
	private history: ExecutionHistory;
	private resultBuilder: ResultBuilder;

	constructor() {
		this.history = new ExecutionHistory();
		this.resultBuilder = new ResultBuilder();
	}

	/**
	 * Execute a workflow with given trigger data.
	 * 
	 * @param workflow - The workflow to execute
	 * @param triggerData - Data that triggered the workflow
	 * @returns Execution result with status and action results
	 */
	async execute(
		workflow: Workflow,
		triggerData: Record<string, unknown>,
	): Promise<WorkflowExecutionResult> {
		const startedAt = Date.now();

		// Check workflow status
		if (workflow.status === "paused") {
			return buildPausedResult(workflow, startedAt);
		}

		if (workflow.status === "draft") {
			return buildDraftResult(workflow, startedAt);
		}

		// Build execution context
		const context: ExecutionContext = {
			workflowId: workflow._id,
			userId: workflow.userId,
			runId: `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			triggerData,
			dryRun: workflow.isDryRun,
		};

		// Execute all actions
		const execution = await executeActions(workflow.actions, context);

		// Build final result
		const result = this.resultBuilder.build(
			workflow,
			execution,
			startedAt,
			triggerData,
		);

		// Log execution
		this.history.log(workflow._id, result);

		return result;
	}

	/**
	 * Get execution history for a workflow.
	 */
	getHistory(workflowId: string): WorkflowExecutionResult[] {
		return this.executionLog.get(workflowId) || [];
	}
}

/**
 * Singleton instance for global use.
 */
export const workflowRunner = new WorkflowRunner();
