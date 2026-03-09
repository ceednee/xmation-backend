import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

export const reportSpamExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "REPORT_SPAM");
	if (dryRunError) {
		return createResult(false, "REPORT_SPAM", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const userId = getUserId(config, context.triggerData as Record<string, unknown>);
		const reason = String(config.reason || "spam");

		if (!userId) {
			return createResult(false, "REPORT_SPAM", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.reportSpam(userId, reason);
		const resultData = result as { reported?: boolean };
		return createResult(true, "REPORT_SPAM", Date.now() - start, { userId, reason, reported: resultData.reported });
	} catch (error) {
		return createResult(false, "REPORT_SPAM", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to report spam");
	}
};
