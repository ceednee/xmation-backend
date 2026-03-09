/**
 * Workflow Executor
 * 
 * Executes all actions in a workflow sequentially.
 * 
 * ## Execution Flow
 * 
 * ```
 * For each action in workflow:
 *   1. Check condition (skip if not met)
 *   2. Execute action
 *   3. Store result
 *   4. Handle delay if specified
 *   5. Stop on error (unless continueOnError)
 * ```
 * 
 * ## Condition Evaluation
 * 
 * Actions can have conditions that determine if they run:
 * ```typescript
 * {
 *   type: "REPLY_TO_TWEET",
 *   condition: { field: "sentiment", operator: "eq", value: "positive" },
 *   config: { text: "Thanks!" }
 * }
 * ```
 * 
 * ## Error Handling
 * 
 * - By default, stops on first error
 * - Set `continueOnError: true` in action config to continue
 * - Error details included in workflow result
 * 
 * @example
 * ```typescript
 * const result = await executeWorkflowActions(
 *   workflow,
 *   { mentionId: "123", text: "Hello" },
 *   { userId: "u1", xUserId: "x1", dryRun: false }
 * );
 * 
 * console.log(result.success);      // overall success
 * console.log(result.actions);      // individual action results
 * console.log(result.error);        // first error if any
 * ```
 */

import type { ActionResult } from "../../actions/types";
import type { ActionConfig, Workflow } from "../../types";
import type { WorkflowExecutionResult, ActionContext } from "./types";
import { executeAction } from "./executor";
import { shouldSkipAction } from "./condition";
import { createFullActionContext, createBaseContext } from "./context";

/**
 * Execute all actions in a workflow.
 * 
 * @param workflow - The workflow to execute
 * @param triggerData - Data that triggered the workflow
 * @param baseContext - Base context with userId, xUserId, dryRun
 * @returns Workflow execution result
 */
export async function executeWorkflowActions(
	workflow: Workflow,
	triggerData: Record<string, unknown>,
	baseContext: { userId: string; xUserId: string | undefined; dryRun: boolean },
): Promise<WorkflowExecutionResult> {
	const startedAt = Date.now();
	const runId = generateRunId();

	// Build full execution context
	const context = createFullActionContext(
		createBaseContext(baseContext.userId, baseContext.xUserId, baseContext.dryRun),
		workflow._id,
		runId,
		triggerData,
	);

	// Execute all actions
	const results = await executeActionsSequentially(workflow.actions, context, triggerData);

	// Build and return result
	return buildWorkflowResult(workflow._id, runId, results, startedAt);
}

/**
 * Execute actions one by one, handling conditions, delays, and errors.
 */
async function executeActionsSequentially(
	actions: ActionConfig[],
	context: ActionContext,
	triggerData: Record<string, unknown>,
): Promise<ActionResult[]> {
	const results: ActionResult[] = [];

	for (const action of actions) {
		// Check condition
		if (shouldSkipAction(action.condition, triggerData)) {
			results.push(buildSkippedResult(action.type));
			continue;
		}

		// Execute action
		const result = await executeAction(action, context);
		results.push(result);
		context.previousResults = results;

		// Handle delay
		if (action.delay && action.delay > 0) {
			await sleep(Math.min(action.delay, 5000)); // Max 5s delay
		}

		// Stop on error unless continueOnError is set
		if (!result.success && action.config.continueOnError !== true) {
			break;
		}
	}

	return results;
}

/**
 * Build a result for a skipped action.
 */
function buildSkippedResult(actionType: string): ActionResult {
	return {
		success: true,
		actionType,
		output: { skipped: true, reason: "Condition not met" },
		executionTimeMs: 0,
	};
}

/**
 * Build the final workflow execution result.
 */
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

/**
 * Find the last error in action results.
 */
function findLastError(results: ActionResult[]): string | undefined {
	for (let i = results.length - 1; i >= 0; i--) {
		if (!results[i].success && results[i].error) {
			return `Action ${results[i].actionType} failed: ${results[i].error}`;
		}
	}
	return undefined;
}

/**
 * Generate a unique run ID.
 */
function generateRunId(): string {
	return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
