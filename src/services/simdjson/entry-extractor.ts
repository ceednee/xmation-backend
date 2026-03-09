export const extractTweetResultFromEntry = (entry: unknown): unknown | null => {
	return (entry as any)?.content?.itemContent?.tweet_results?.result || null;
};

export const extractUserResultFromEntry = (entry: unknown): unknown | null => {
	return (entry as any)?.content?.itemContent?.user_results?.result || null;
};
