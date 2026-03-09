import type { TriggerContext, TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const newMentionEvaluator: TriggerEvaluator = (config, context) => {
	const mentions = context.mentions || [];
	let filteredMentions = mentions.filter(
		(m) => m.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	const keywords = Array.isArray(config.keywords)
		? config.keywords.filter((k): k is string => typeof k === "string")
		: [];

	if (keywords.length > 0) {
		filteredMentions = filteredMentions.filter((m) =>
			keywords.some((keyword: string) =>
				m.text.toLowerCase().includes(keyword.toLowerCase()),
			),
		);
	}

	if (filteredMentions.length === 0) {
		return createResult(false, "NEW_MENTION");
	}

	return createResult(true, "NEW_MENTION", {
		mentions: filteredMentions,
		count: filteredMentions.length,
		latestMention: filteredMentions[0],
	});
};
