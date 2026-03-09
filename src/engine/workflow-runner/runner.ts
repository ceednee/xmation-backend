import type { Workflow } from "../../types";
import type { WorkflowExecutionResult, ExecutionContext, ExecutionState } from "./types";
import { createPausedResult, createDraftResult, createSuccessResult } from "./result";
import { ExecutionHistory } from "./history";
import { ActionExecutor } from "./action-executor";

export class WorkflowRunner {
	private actionExecutor: ActionExecutor;
	private history: ExecutionHistory;

	constructor() {
		this.actionExecutor = new ActionExecutor();
		this.history = new ExecutionHistory();
	}

	async execute(workflow: Workflow, triggerData: Record<string, unknown>): Promise<WorkflowExecutionResult> {
		const startedAt = Date.now();

		if (workflow.status === "paused") {
			return createPausedResult(workflow._id, workflow.userId, workflow.isDryRun, startedAt);
		}

		if (workflow.status === "draft") {
			return createDraftResult(workflow._id, workflow.userId, workflow.isDryRun, startedAt);
		}

		const mode = workflow.isDryRun ? "dry_run" : "live";
		const logs: string[] = [`Starting workflow execution: ${workflow.name} (${mode} mode)`];

		const context: ExecutionContext = {
			userId: workflow.userId,
			triggerData,
			dryRun: workflow.isDryRun,
		};

		const state: ExecutionState = {
			actionsExecuted: 0,
			actionsFailed: 0,
			hasErrors: false,
			logs,
		};

		for (const action of workflow.actions) {
			await this.actionExecutor.executeWithErrorHandling(action, context, state);
		}

		const result = createSuccessResult(
			workflow._id,
			workflow.userId,
			mode,
			state,
			startedAt,
			triggerData
		);

		this.history.log(workflow._id, result);
		return result;
	}

	getExecutionHistory(workflowId: string): WorkflowExecutionResult[] {
		return this.history.get(workflowId);
	}
}

export const workflowRunner = new WorkflowRunner();
