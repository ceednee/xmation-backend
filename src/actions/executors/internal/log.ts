import type { ActionExecutor } from "../../types";
import { createResult } from "./base";

export const logEventExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		const logEntry = {
			timestamp: Date.now(),
			eventType: String(config.eventType || "action_executed"),
			workflowId: context.workflowId,
			runId: context.runId,
			userId: context.userId,
			actionType: String(config.actionType || "LOG_EVENT"),
			metadata: {
				...(config.metadata as Record<string, unknown>),
				triggerData: context.triggerData,
			},
		};

		console.log("[LOG_EVENT]", JSON.stringify(logEntry));

		return createResult(true, "LOG_EVENT", Date.now() - start, { logged: true, eventType: logEntry.eventType });
	} catch (error) {
		return createResult(false, "LOG_EVENT", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to log event");
	}
};
