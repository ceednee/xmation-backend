import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

export const blockUserExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "BLOCK_USER");
	if (dryRunError) {
		return createResult(false, "BLOCK_USER", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const userId = getUserId(config, context.triggerData as Record<string, unknown>);

		if (!userId) {
			return createResult(false, "BLOCK_USER", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.blockUser(userId) as { data?: { blocked?: boolean } };
		return createResult(true, "BLOCK_USER", Date.now() - start, {
			userId,
			blocked: result.data?.blocked,
		});
	} catch (error) {
		return createResult(false, "BLOCK_USER", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to block user");
	}
};
