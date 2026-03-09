import type { ActionContext, XApiClient } from "./types";
import { createMockXClient } from "./mock-client";

export const getXClient = async (context: ActionContext): Promise<XApiClient> => {
	if (context.dryRun) {
		return createMockXClient();
	}
	console.log("[X API] Live mode requested but X OAuth not implemented, using mock");
	return createMockXClient();
};

export const checkDryRun = (context: ActionContext, actionType: string): string | null => {
	if (!context.dryRun) {
		return `${actionType} not implemented - dry run only`;
	}
	return null;
};
