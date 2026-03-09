import type { ActionExecutor } from "../../types";
import { createResult, replaceTemplates, getXClient, checkDryRun } from "./base";

export const sendDMExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "SEND_DM");
	if (dryRunError) {
		return createResult(false, "SEND_DM", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const text = replaceTemplates(String(config.text ?? ""), context);
		const triggerData = context.triggerData as Record<string, unknown>;
		const userId = String(config.userId || triggerData.authorId || triggerData.followerId || "");

		if (!userId) {
			return createResult(false, "SEND_DM", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.sendDM(userId, text) as { data?: { id?: string } };
		return createResult(true, "SEND_DM", Date.now() - start, {
			dmId: result.data?.id,
			text,
			recipientId: userId,
		});
	} catch (error) {
		return createResult(false, "SEND_DM", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to send DM");
	}
};
