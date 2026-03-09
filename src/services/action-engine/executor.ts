/**
 * Action Executor
 * 
 * Executes a single action with validation and error handling.
 * 
 * ## Execution Steps
 * 
 * 1. Look up action definition in registry
 * 2. Validate required configuration
 * 3. Merge with default config
 * 4. Execute action handler
 * 5. Return result or error
 * 
 * ## Error Handling
 * 
 * - Unknown action type → returns error result
 * - Missing required config → returns validation error
 * - Execution error → caught and returned as failure
 * 
 * @example
 * ```typescript
 * const result = await executeAction(
 *   { type: "REPLY_TO_TWEET", config: { text: "Thanks!" } },
 *   { userId: "u1", workflowId: "w1", runId: "r1", triggerData: {}, dryRun: false }
 * );
 * 
 * if (result.success) {
 *   console.log("Reply posted:", result.output);
 * } else {
 *   console.error("Failed:", result.error);
 * }
 * ```
 */

import {
	getActionDefinition,
	validateActionConfig,
} from "../../actions/executors";
import type { ActionResult } from "../../actions/types";
import type { ActionConfig } from "../../types";
import type { ActionContext } from "./types";

/**
 * Execute a single action with full validation and error handling.
 * 
 * @param action - The action configuration (type + config)
 * @param context - Execution context with user/workflow/trigger data
 * @returns Action result with success flag and output or error
 */
export async function executeAction(
	action: ActionConfig,
	context: ActionContext,
): Promise<ActionResult> {
	const start = Date.now();
	const definition = getActionDefinition(action.type);

	// Check action type exists
	if (!definition) {
		return buildErrorResult(action.type, `Unknown action type: ${action.type}`, start);
	}

	// Validate required config
	const validationErrors = validateActionConfig(action.type, action.config);
	if (validationErrors.length > 0) {
		return buildErrorResult(action.type, validationErrors.join(", "), start);
	}

	// Merge with defaults
	const config = {
		...definition.defaultConfig,
		...action.config,
	};

	// Execute
	try {
		return await definition.executor(config, context);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Action execution failed";
		return buildErrorResult(action.type, message, start);
	}
}

/**
 * Build a standardized error result.
 */
function buildErrorResult(
	actionType: string,
	error: string,
	startTime: number,
): ActionResult {
	return {
		success: false,
		actionType,
		error,
		executionTimeMs: Date.now() - startTime,
	};
}
