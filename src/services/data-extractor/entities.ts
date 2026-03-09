/**
 * Entity Extractor
 * 
 * Extracts entities (hashtags, mentions, URLs) from tweet data.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract hashtags
 * const hashtags = extractHashtags(tweetEntities);
 * // → ["javascript", "typescript"]
 * 
 * // Extract mentions
 * const mentions = extractMentions(tweetEntities);
 * // → [{ screenName: "user", name: "User Name", id: "123", indices: [0, 5] }]
 * 
 * // Extract URLs
 * const urls = extractUrls(tweetEntities);
 * // → [{ url: "...", expandedUrl: "...", displayUrl: "...", indices: [0, 23] }]
 * 
 * // Extract all at once
 * const all = extractEntities(tweetResponse);
 * ```
 */

import type { TweetEntities, TweetUrl, TweetMention, TweetHashtag, RapidApiTweetResponse } from "../../types/rapidapi";

/**
 * Extract hashtags from tweet entities
 * 
 * @param entities - Tweet entities from API
 * @returns Array of hashtag strings (without #)
 */
export const extractHashtags = (entities?: TweetEntities): string[] => {
	return entities?.hashtags?.map((h) => h.text) || [];
};

/**
 * Extract user mentions from tweet entities
 * 
 * @param entities - Tweet entities from API
 * @returns Array of mention objects with screen name, display name, ID, and position
 */
export const extractMentions = (entities?: TweetEntities): Array<{ screenName: string; name: string; id: string; indices: number[] }> => {
	return (
		entities?.user_mentions?.map((m) => ({
			screenName: m.screen_name,
			name: m.name,
			id: m.id_str,
			indices: m.indices,
		})) || []
	);
};

/**
 * Extract URLs from tweet entities
 * 
 * @param entities - Tweet entities from API
 * @returns Array of URL objects with short, expanded, and display URLs
 */
export const extractUrls = (entities?: TweetEntities): Array<{ url: string; expandedUrl: string; displayUrl: string; indices: number[] }> => {
	return (
		entities?.urls?.map((u) => ({
			url: u.url,
			expandedUrl: u.expanded_url,
			displayUrl: u.display_url,
			indices: u.indices,
		})) || []
	);
};

/**
 * Extract all entities from a tweet response
 * 
 * Convenience function to extract hashtags, mentions, and URLs in one call.
 * 
 * @param data - RapidAPI tweet response
 * @returns Object with all entity types
 */
export const extractEntities = (data?: RapidApiTweetResponse): {
	hashtags: string[];
	mentions: Array<{ screenName: string; name: string; id: string; indices: number[] }>;
	urls: Array<{ url: string; expandedUrl: string; displayUrl: string; indices: number[] }>;
} => {
	if (!data?.data?.tweetResult?.legacy?.entities) {
		return { hashtags: [], mentions: [], urls: [] };
	}

	const entities = data.data.tweetResult.legacy.entities;
	return {
		hashtags: extractHashtags(entities),
		mentions: extractMentions(entities),
		urls: extractUrls(entities),
	};
};
