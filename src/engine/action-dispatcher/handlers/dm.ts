import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

export const handleSendDM = async (
	config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			"SEND_DM",
			"dry_run",
			{ text: config.text, simulated: true },
			0,
			true
		);
	}

	return createSuccessResult(
		"SEND_DM",
		"dm_" + Date.now(),
		{
			text: config.text,
			recipientId: config.recipientId,
			dmId: "dm_" + Date.now(),
		},
		150
	);
};
