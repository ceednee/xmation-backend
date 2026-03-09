import type { TweetEntities, TweetUrl, TweetMention, TweetHashtag, RapidApiTweetResponse } from "../../types/rapidapi";

export const extractHashtags = (entities?: TweetEntities): string[] => {
	return entities?.hashtags?.map((h) => h.text) || [];
};

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
