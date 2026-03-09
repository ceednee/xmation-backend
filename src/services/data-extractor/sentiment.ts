/**
 * Sentiment Analyzer
 * 
 * Basic sentiment detection using keyword matching.
 * Identifies negative sentiment in text content.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Detect negative sentiment
 * const result = detectNegativeSentiment("This is terrible service");
 * console.log(result.hasNegative);     // true
 * console.log(result.matchedWords);    // ["terrible"]
 * 
 * // Use custom word list
 * const result = detectNegativeSentiment(text, ["spam", "scam", "fake"]);
 * ```
 */

/** Default list of negative indicator words */
const DEFAULT_NEGATIVE_WORDS = [
	"terrible", "awful", "bad", "hate", "worst", "suck",
	"disappointing", "angry", "frustrated", "annoying",
	"horrible", "disgusting", "pathetic", "useless", "stupid",
];

/**
 * Detect negative sentiment in text
 * 
 * Uses simple keyword matching to identify potentially negative content.
 * For production use, consider using a proper NLP sentiment analysis API.
 * 
 * @param text - Text to analyze
 * @param negativeWords - Custom list of negative words (defaults provided)
 * @returns Object with hasNegative flag and matched words
 */
export function detectNegativeSentiment(
	text: string,
	negativeWords: string[] = DEFAULT_NEGATIVE_WORDS,
): { hasNegative: boolean; matchedWords: string[] } {
	const lowerText = text.toLowerCase();
	const matchedWords = negativeWords.filter((word) =>
		lowerText.includes(word.toLowerCase()),
	);

	return {
		hasNegative: matchedWords.length > 0,
		matchedWords,
	};
}
