import type { RapidApiTweetResponse, XTweet } from "../../types/rapidapi";
import { extractHashtags, extractMentions, extractUrls } from "./entities";

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
