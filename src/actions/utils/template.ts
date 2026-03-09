import type { ActionContext } from "../types";
import { sanitizeXss } from "./xss";

export const replaceTemplates = (text: string, context: ActionContext): string => {
	return text.replace(/{{(\w+)}}/g, (match, key) => {
		const triggerData = context.triggerData as Record<string, unknown>;
		if (triggerData[key] !== undefined) {
			return String(triggerData[key]);
		}
		if (triggerData.authorUsername && key === "authorUsername") {
			return sanitizeXss(String(triggerData.authorUsername));
		}
		if (triggerData.followerUsername && key === "followerUsername") {
			return sanitizeXss(String(triggerData.followerUsername));
		}
		return match;
	});
};
