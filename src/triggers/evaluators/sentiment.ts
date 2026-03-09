/**
 * Trigger Evaluator: NEGATIVE_SENTIMENT
 * 
 * Detects negative sentiment in mentions using keyword matching.
 * Useful for reputation management and customer service alerts.
 * 
 * ## Configuration
 * - `negativeWords` - Array of negative keywords to detect (optional)
 *   - Default: ["terrible", "awful", "bad", "hate", "worst", "suck", "disappointing", "angry", "frustrated", "annoying"]
 * 
 * ## Trigger Data
 * - `mentions` - Array of mentions to analyze
 * 
 * ## Logic
 * - Case-insensitive keyword matching in mention text
 * - Triggers if any mention contains any negative word
 * 
 * ## Returns
 * - `triggered` - True if negative sentiment detected in mentions
 * - `data.mentions` - Array of mentions with negative sentiment
 * - `data.count` - Number of negative mentions
 * - `data.detectedWords` - Which negative words were found
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Default list of negative sentiment keywords
 */
const DEFAULT_NEGATIVE_WORDS = [
	"terrible", "awful", "bad", "hate", "worst",
	"suck", "disappointing", "angry", "frustrated", "annoying",
];

/**
 * Evaluates NEGATIVE_SENTIMENT trigger
 * Checks mentions for negative sentiment keywords
 */
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
