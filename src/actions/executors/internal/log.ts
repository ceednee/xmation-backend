/**
 * Action: LOG_EVENT
 * 
 * Logs analytics events and action execution metadata for debugging,
 * monitoring, and analytics purposes.
 * 
 * ## Configuration
 * - `eventType` (optional) - Type of event to log. Defaults to "action_executed"
 * - `actionType` (optional) - Action type identifier. Defaults to "LOG_EVENT"
 * - `metadata` (optional) - Additional metadata to include in the log entry
 * 
 * ## Context Data
 * - Uses `workflowId`, `runId`, `userId`, `triggerData` from context
 * 
 * ## Example
 * ```typescript
 * const config = {
 *   eventType: "user_engagement",
 *   actionType: "MENTION_RECEIVED",
 *   metadata: { sentiment: "positive" }
 * };
 * const result = await logEventExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult } from "./base";

/**
 * Executes LOG_EVENT action
 * Creates and outputs a structured log entry
 * 
 * @param config - Action configuration with event details
 * @param context - Action execution context
 * @returns Action result with logging status
 */
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
