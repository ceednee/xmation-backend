/**
 * Entry Extractor
 * 
 * Extracts specific result types from timeline entries.
 * Low-level extraction utilities.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract tweet result from entry
 * const tweetResult = extractTweetResultFromEntry(entry);
 * 
 * // Extract user result from entry
 * const userResult = extractUserResultFromEntry(entry);
 * ```
 */

/**
 * Extract tweet result from a timeline entry
 * 
 * @param entry - Timeline entry
 * @returns Tweet result object or null
 */
export const extractTweetResultFromEntry = (entry: unknown): unknown | null => {
	return (entry as any)?.content?.itemContent?.tweet_results?.result || null;
};

/**
 * Extract user result from a timeline entry
 * 
 * @param entry - Timeline entry
 * @returns User result object or null
 */
export const extractUserResultFromEntry = (entry: unknown): unknown | null => {
	return (entry as any)?.content?.itemContent?.user_results?.result || null;
};
