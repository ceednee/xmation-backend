import type { ActionContext } from "../../types";
import { createResult, replaceTemplates } from "../../utils";
import { getXClient, checkDryRun } from "../../x-client";

export { createResult, replaceTemplates, getXClient, checkDryRun };
export type { ActionContext };

export const getTweetId = (config: Record<string, unknown>, triggerData: Record<string, unknown>): string => {
	return String(config.tweetId || triggerData.tweetId || triggerData.mentionId || "");
};

export const getUserId = (config: Record<string, unknown>, triggerData: Record<string, unknown>): string => {
	return String(config.userId || triggerData.authorId || "");
};
