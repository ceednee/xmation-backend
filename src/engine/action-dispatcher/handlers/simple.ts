import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

export const SIMPLE_ACTIONS = [
	"FOLLOW_BACK",
	"RETWEET",
	"QUOTE_TWEET",
	"PIN_TWEET",
	"THANK_YOU_REPLY",
	"ADD_TO_LIST",
	"BLOCK_USER",
	"REPORT_SPAM",
	"ALERT_ADMIN",
] as const;

export const createSimpleHandler = (actionType: string) => async (
	_config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			actionType,
			"dry_run",
			{ simulated: true },
			0,
			true
		);
	}

	return createSuccessResult(
		actionType,
		actionType.toLowerCase() + "_" + Date.now(),
		{ completed: true },
		100
	);
};
