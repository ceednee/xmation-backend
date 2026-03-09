import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

export const handleLogEvent = async (
	config: Record<string, unknown>,
	_context: ActionContext
): Promise<ActionExecutionResult> => {
	console.log("[LOG_EVENT]", config.event, config.metadata);

	return createSuccessResult(
		"LOG_EVENT",
		"log_" + Date.now(),
		{ event: config.event, logged: true },
		10
	);
};
