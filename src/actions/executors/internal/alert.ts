import type { ActionExecutor } from "../../types";
import { createResult } from "./base";

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
