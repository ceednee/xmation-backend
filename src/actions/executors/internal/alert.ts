/**
 * Action: ALERT_ADMIN
 * 
 * Sends administrative alerts for security events, workflow failures,
 * or other important system notifications.
 * 
 * ## Configuration
 * - `severity` (optional) - Alert severity level: "low", "medium", "high", "critical". Defaults to "medium"
 * - `message` (optional) - Custom alert message. Defaults to "Alert triggered"
 * 
 * ## Context Data
 * - Uses `workflowId`, `runId`, `userId`, `triggerData` from context
 * 
 * ## Example
 * ```typescript
 * const config = { 
 *   severity: "high", 
 *   message: "Suspicious activity detected" 
 * };
 * const result = await alertAdminExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult } from "./base";

/**
 * Executes ALERT_ADMIN action
 * Logs an admin alert with severity and context information
 * 
 * @param config - Action configuration with optional severity and message
 * @param context - Action execution context
 * @returns Action result with alert details
 */
export const alertAdminExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		const alert = {
			severity: config.severity || "medium",
			message: config.message || "Alert triggered",
			workflowId: context.workflowId,
			runId: context.runId,
			userId: context.userId,
			timestamp: Date.now(),
			triggerData: context.triggerData,
		};

		console.log("[ADMIN_ALERT]", JSON.stringify(alert));

		return createResult(true, "ALERT_ADMIN", Date.now() - start, { alerted: true, severity: alert.severity });
	} catch (error) {
		return createResult(false, "ALERT_ADMIN", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to send alert");
	}
};
