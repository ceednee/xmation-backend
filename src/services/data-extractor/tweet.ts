/**
 * Tweet Data Extractor
 * 
 * Extracts tweet data from X (Twitter) API responses.
 * Supports single tweet extraction and timeline extraction.
 */

import type { RapidApiTweetResponse, XTweet } from "../../types/rapidapi";
import { extractHashtags, extractMentions, extractUrls } from "./entities";

/**
 * Extract a single tweet from API response
 * 
 * @param data - RapidAPI tweet response
 * @returns XTweet object or null if extraction fails
 */
export function extractTweet(data: RapidApiTweetResponse): XTweet | null {
	try {
		const tweet = data?.data?.tweetResult;
		if (!tweet) return null;

		const legacy = tweet.legacy;
		if (!legacy) return null;

		const userResult = tweet.core?.user_results?.result;

		return {
			restId: tweet.rest_id,
			createdAt: legacy.created_at,
			text: legacy.text,
			authorId: userResult?.rest_id || "",
			authorScreenName: userResult?.legacy?.screen_name || "",
			inReplyToStatusId: legacy.in_reply_to_status_id_str,
			inReplyToUserId: legacy.in_reply_to_user_id_str,
			retweetCount: legacy.retweet_count || 0,
			favoriteCount: legacy.favorite_count || 0,
			replyCount: legacy.reply_count || 0,
			quoteCount: legacy.quote_count || 0,
			conversationId: legacy.conversation_id_str,
			lang: legacy.lang || "en",
			views: tweet.views?.count,
			hashtags: extractHashtags(legacy.entities),
			mentions: extractMentions(legacy.entities),
			urls: extractUrls(legacy.entities),
		};
	} catch (error) {
		console.error("Failed to extract tweet:", error);
		return null;
	}
}

/**
 * Extract multiple tweets from a timeline response
 * 
 * @param data - Timeline response data
 * @returns Array of XTweet objects (may be partial data)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractTweets(data: any): XTweet[] {
	const tweets: XTweet[] = [];
	const instructions = data?.data?.tweetResult?.result?.timeline?.instructions || [];
	
	for (const instruction of instructions) {
		const entries = instruction.entries || [];
		for (const entry of entries) {
			const tweetId = entry.content?.itemContent?.tweet?.id;
			if (tweetId) {
				// Placeholder - in real implementation, would fetch full tweet data
				tweets.push({
					restId: tweetId,
					createdAt: new Date().toISOString(),
					text: "",
					authorId: "",
					authorScreenName: "",
					retweetCount: 0,
					favoriteCount: 0,
					replyCount: 0,
					quoteCount: 0,
					conversationId: "",
					lang: "en",
					hashtags: [],
					mentions: [],
					urls: [],
				});
			}
		}
	}
	
	return tweets;
}
