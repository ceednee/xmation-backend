import {
	getActionDefinition,
	validateActionConfig,
} from "../../actions/executors";
import type { ActionResult } from "../../actions/types";
import type { ActionConfig } from "../../types";
import type { ActionContext } from "./types";

export async function executeAction(
	action: ActionConfig,
	context: ActionContext,
): Promise<ActionResult> {
	const start = Date.now();
	const definition = getActionDefinition(action.type);

	if (!definition) {
		return buildErrorResult(action.type, `Unknown action type: ${action.type}`, start);
	}

	const validationErrors = validateActionConfig(action.type, action.config);
	if (validationErrors.length > 0) {
		return buildErrorResult(action.type, validationErrors.join(", "), start);
	}

	const config = { ...definition.defaultConfig, ...action.config };

	try {
		return await definition.executor(config, context);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Action execution failed";
		return buildErrorResult(action.type, message, start);
	}
}

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
