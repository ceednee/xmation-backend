const DEFAULT_NEGATIVE_WORDS = [
	"terrible", "awful", "bad", "hate", "worst", "suck",
	"disappointing", "angry", "frustrated", "annoying",
	"horrible", "disgusting", "pathetic", "useless", "stupid",
];

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
