/**
 * Action: ADD_TO_LIST
 * 
 * Adds a user to an X (Twitter) list.
 * Lists are curated groups of accounts for organized timeline viewing.
 * 
 * ## Configuration
 * - `listId` (required) - ID of the X list to add the user to
 * - `userId` (optional) - X user ID to add to the list
 *   - If not provided, uses authorId from trigger data
 * 
 * ## Context Data
 * - `triggerData.authorId` - User ID to add (if not in config)
 * 
 * ## Example
 * ```typescript
 * const config = { 
 *   listId: "987654321",
 *   userId: "123456789" 
 * };
 * const result = await addToListExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, getXClient, checkDryRun, getUserId } from "./base";

/**
 * Executes ADD_TO_LIST action
 * Adds the specified user to the specified list
 * 
 * @param config - Action configuration with listId and optional userId
 * @param context - Action execution context
 * @returns Action result with addition status
 */
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
