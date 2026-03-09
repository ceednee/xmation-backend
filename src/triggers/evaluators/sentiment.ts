import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

const DEFAULT_NEGATIVE_WORDS = [
	"terrible", "awful", "bad", "hate", "worst",
	"suck", "disappointing", "angry", "frustrated", "annoying",
];

export const negativeSentimentEvaluator: TriggerEvaluator = (config, context) => {
	const negativeWords: string[] =
		Array.isArray(config.negativeWords) &&
		config.negativeWords.every((w): w is string => typeof w === "string")
			? config.negativeWords
			: DEFAULT_NEGATIVE_WORDS;

	const mentions = context.mentions || [];
	const negativeMentions = mentions.filter((m) =>
		negativeWords.some((word: string) =>
			m.text.toLowerCase().includes(word.toLowerCase()),
		),
	);

	if (negativeMentions.length === 0) {
		return createResult(false, "NEGATIVE_SENTIMENT");
	}

	return createResult(true, "NEGATIVE_SENTIMENT", {
		mentions: negativeMentions,
		count: negativeMentions.length,
		detectedWords: negativeWords.filter((word: string) =>
			negativeMentions.some((m) =>
				m.text.toLowerCase().includes(word.toLowerCase()),
			),
		),
	});
};
