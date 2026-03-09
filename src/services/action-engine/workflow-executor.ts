import type { ActionResult } from "../../actions/types";
import type { ActionConfig, Workflow } from "../../types";
import type { WorkflowExecutionResult, ActionContext } from "./types";
import { executeAction } from "./executor";
import { shouldSkipAction } from "./condition";
import { createFullActionContext, createBaseContext } from "./context";

export async function executeWorkflowActions(
	workflow: Workflow,
	triggerData: Record<string, unknown>,
	baseContext: { userId: string; xUserId: string | undefined; dryRun: boolean },
): Promise<WorkflowExecutionResult> {
	const startedAt = Date.now();
	const runId = generateRunId();

	const context = createFullActionContext(
		createBaseContext(baseContext.userId, baseContext.xUserId, baseContext.dryRun),
		workflow._id,
		runId,
		triggerData,
	);

	const results = await executeActionsSequentially(workflow.actions, context, triggerData);

	return buildWorkflowResult(workflow._id, runId, results, startedAt);
}

async function executeActionsSequentially(
	actions: ActionConfig[],
	context: ActionContext,
	triggerData: Record<string, unknown>,
): Promise<ActionResult[]> {
	const results: ActionResult[] = [];

	for (const action of actions) {
		if (shouldSkipAction(action.condition, triggerData)) {
			results.push(buildSkippedResult(action.type));
			continue;
		}

		const result = await executeAction(action, context);
		results.push(result);
		context.previousResults = results;

		if (action.delay && action.delay > 0) {
			await sleep(Math.min(action.delay, 5000));
		}

		if (!result.success && action.config.continueOnError !== true) {
			break;
		}
	}

	return results;
}

function buildSkippedResult(actionType: string): ActionResult {
	return {
		success: true,
		actionType,
		output: { skipped: true, reason: "Condition not met" },
		executionTimeMs: 0,
	};
}

function buildWorkflowResult(
	workflowId: string,
	runId: string,
	results: ActionResult[],
	startedAt: number,
): WorkflowExecutionResult {
	const allSuccessful = results.every((r) => r.success);
	const lastError = findLastError(results);

	return {
		workflowId,
		runId,
		success: allSuccessful,
		actions: results,
		startedAt,
		completedAt: Date.now(),
		error: lastError,
	};
}

function findLastError(results: ActionResult[]): string | undefined {
	for (let i = results.length - 1; i >= 0; i--) {
		if (!results[i].success && results[i].error) {
			return `Action ${results[i].actionType} failed: ${results[i].error}`;
		}
	}
	return undefined;
}

function generateRunId(): string {
	return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
