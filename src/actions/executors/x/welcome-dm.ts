import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun } from "./base";

export const welcomeDMExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "WELCOME_DM");
	if (dryRunError) {
		return createResult(false, "WELCOME_DM", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const message = replaceTemplates(String(config.message || "Welcome! Thanks for following!"), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(triggerData.followerId || "");

		if (!userId) {
			return createResult(false, "WELCOME_DM", Date.now() - start, undefined, "No follower ID provided");
		}

		const result = await xClient.sendDM(userId, message);
		return createResult(true, "WELCOME_DM", Date.now() - start, {
			dmId: result.data?.id,
			message,
			recipientId: userId,
		});
	} catch (error) {
		return createResult(false, "WELCOME_DM", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to send welcome DM");
	}
};
