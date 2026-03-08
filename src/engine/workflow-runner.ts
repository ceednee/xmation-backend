/**
 * Workflow Runner
 * 
 * Executes workflows when triggers are activated.
 * Handles action execution, delays, and result tracking.
 */

import type { Workflow, ActionConfig } from "../types";
import { ActionDispatcher } from "./action-dispatcher";

export interface WorkflowExecutionResult {
	success: boolean;
	workflowId: string;
	userId: string;
	status: "completed" | "failed" | "partial";
	mode: "live" | "dry_run";
	actionsExecuted: number;
	actionsFailed: number;
	logs: string[];
	error?: string;
	startedAt: number;
	completedAt: number;
	context?: Record<string, unknown>;
}

export interface ExecutionContext {
	userId: string;
	xAccessToken?: string;
	triggerData: Record<string, unknown>;
	dryRun?: boolean;
}

/**
 * Workflow Runner
 */
export class WorkflowRunner {
	private actionDispatcher: ActionDispatcher;
	private executionLog: Map<string, WorkflowExecutionResult[]> = new Map();

	constructor() {
		this.actionDispatcher = new ActionDispatcher();
	}

	/**
	 * Execute a workflow
	 */
	async execute(
		workflow: Workflow,
		triggerData: Record<string, unknown>
	): Promise<WorkflowExecutionResult> {
		const startedAt = Date.now();
		const logs: string[] = [];

		// Check workflow status
		if (workflow.status === "paused") {
			return {
				success: false,
				workflowId: workflow._id,
				userId: workflow.userId,
				status: "failed",
				mode: workflow.isDryRun ? "dry_run" : "live",
				actionsExecuted: 0,
				actionsFailed: 0,
				logs: ["Workflow is paused"],
				error: "Workflow is paused",
				startedAt,
				completedAt: Date.now(),
			};
		}

		if (workflow.status === "draft") {
			return {
				success: false,
				workflowId: workflow._id,
				userId: workflow.userId,
				status: "failed",
				mode: workflow.isDryRun ? "dry_run" : "live",
				actionsExecuted: 0,
				actionsFailed: 0,
				logs: ["Workflow is in draft mode"],
				error: "Workflow is in draft mode",
				startedAt,
				completedAt: Date.now(),
			};
		}

		// Determine execution mode
		const isDryRun = workflow.isDryRun;
		const mode = isDryRun ? "dry_run" : "live";

		logs.push(`Starting workflow execution: ${workflow.name} (${mode} mode)`);

		// Build execution context
		const context: ExecutionContext = {
			userId: workflow.userId,
			triggerData,
			dryRun: isDryRun,
		};

		// Execute actions
		let actionsExecuted = 0;
		let actionsFailed = 0;
		let hasErrors = false;
		let firstError: string | undefined;

		for (const action of workflow.actions) {
			try {
				logs.push(`Executing action: ${action.type} (${action.id})`);

				// Wait for delay if specified
				if (action.delay && action.delay > 0) {
					logs.push(`Waiting ${action.delay}ms before executing`);
					await this.sleep(action.delay);
				}

				// Execute action
				const result = await this.actionDispatcher.execute(action, context);

				if (result.success) {
					actionsExecuted++;
					logs.push(`Action completed: ${action.type}`);
				} else {
					actionsFailed++;
					hasErrors = true;
					logs.push(`Action failed: ${action.type} - ${result.error}`);
					if (!firstError) {
						firstError = result.error;
					}
				}
			} catch (error) {
				actionsFailed++;
				hasErrors = true;
				const errorMessage = error instanceof Error ? error.message : String(error);
				logs.push(`Action error: ${action.type} - ${errorMessage}`);
				if (!firstError) {
					firstError = errorMessage;
				}
			}
		}

		// Determine final status
		let status: "completed" | "failed" | "partial";
		if (actionsFailed === 0) {
			status = "completed";
		} else if (actionsExecuted === 0) {
			status = "failed";
		} else {
			status = "partial";
		}

		const completedAt = Date.now();

		const result: WorkflowExecutionResult = {
			success: !hasErrors || actionsExecuted > 0,
			workflowId: workflow._id,
			userId: workflow.userId,
			status,
			mode,
			actionsExecuted,
			actionsFailed,
			logs,
			error: firstError,
			startedAt,
			completedAt,
			context: triggerData,
		};

		// Store execution log
		this.logExecution(workflow._id, result);

		return result;
	}

	/**
	 * Get execution history for a workflow
	 */
	getExecutionHistory(workflowId: string): WorkflowExecutionResult[] {
		return this.executionLog.get(workflowId) || [];
	}

	/**
	 * Store execution result
	 */
	private logExecution(
		workflowId: string,
		result: WorkflowExecutionResult
	): void {
		const history = this.executionLog.get(workflowId) || [];
		history.push(result);

		// Keep only last 100 executions
		if (history.length > 100) {
			history.shift();
		}

		this.executionLog.set(workflowId, history);
	}

	/**
	 * Sleep utility
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Export singleton instance
export const workflowRunner = new WorkflowRunner();
