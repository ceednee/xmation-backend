import type { BaseActionContext, ActionContext } from "./types";

export function createBaseContext(
	userId: string,
	xUserId: string | undefined,
	dryRun: boolean,
): BaseActionContext {
	return { userId, xUserId, dryRun };
}

/**
 * Create base action context (backward compatible with original signature)
 */
export function createActionContext(
	userId: string,
	xUserId: string | undefined,
	dryRun: boolean,
): BaseActionContext {
	return { userId, xUserId, dryRun };
}

export function createFullActionContext(
	base: BaseActionContext,
	workflowId: string,
	runId: string,
	triggerData: Record<string, unknown>,
): ActionContext {
	return {
		...base,
		workflowId,
		runId,
		triggerData,
		previousResults: [],
		dryRun: base.dryRun,
	};
}
