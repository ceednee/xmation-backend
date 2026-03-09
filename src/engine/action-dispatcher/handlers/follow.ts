import type { ActionContext, ActionExecutionResult } from "../types";
import { createSuccessResult } from "../result";

export const handleFollowUser = async (
	config: Record<string, unknown>,
	context: ActionContext
): Promise<ActionExecutionResult> => {
	if (context.dryRun) {
		return createSuccessResult(
			"FOLLOW_USER",
			"dry_run",
			{ userId: config.userId, simulated: true },
			0,
			true
		);
	}

	return createSuccessResult(
		"FOLLOW_USER",
		"follow_" + Date.now(),
		{ userId: config.userId, followed: true },
		200
	);
};
