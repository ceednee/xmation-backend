import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

export const addToListExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();
	const dryRunError = checkDryRun(context, "ADD_TO_LIST");
	if (dryRunError) {
		return createResult(false, "ADD_TO_LIST", Date.now() - start, undefined, dryRunError);
	}

	const xClient = await getXClient(context);
	try {
		const listId = String(config.listId || "");
		const userId = getUserId(config, context.triggerData as Record<string, unknown>);

		if (!listId) {
			return createResult(false, "ADD_TO_LIST", Date.now() - start, undefined, "No list ID provided");
		}
		if (!userId) {
			return createResult(false, "ADD_TO_LIST", Date.now() - start, undefined, "No user ID provided");
		}

		const result = await xClient.addToList(listId, userId);
		const resultData = result as { added?: boolean };
		return createResult(true, "ADD_TO_LIST", Date.now() - start, { listId, userId, added: resultData.added });
	} catch (error) {
		return createResult(false, "ADD_TO_LIST", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to add to list");
	}
};
