/**
 * Action: REPORT_SPAM
 * 
 * Reports a user as spam on X (Twitter).
 * Use responsibly for actual spam accounts violating platform rules.
 * 
 * ## Configuration
 * - `userId` (optional) - X user ID to report
 *   - If not provided, uses authorId from trigger data
 * - `reason` (optional) - Reason for the report. Defaults to "spam"
 * 
 * ## Context Data
 * - `triggerData.authorId` - User ID to report (if not in config)
 * 
 * ## Example
 * ```typescript
 * const config = { 
 *   userId: "123456789",
 *   reason: "spam" 
 * };
 * const result = await reportSpamExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

/**
 * Executes REPORT_SPAM action
 * Reports the specified user for spam
 * 
 * @param config - Action configuration with optional userId and reason
 * @param context - Action execution context
 * @returns Action result with report status
 */
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
