import type { XMention } from "../../types/rapidapi";
import { extractHashtags, extractMentions, extractUrls } from "./entities";

interface TweetResult {
	rest_id: string;
	legacy?: {
		created_at: string;
		text: string;
		in_reply_to_status_id_str?: string;
		in_reply_to_user_id_str?: string;
		retweet_count?: number;
		favorite_count?: number;
		reply_count?: number;
		quote_count?: number;
		conversation_id_str?: string;
		lang?: string;
		entities?: unknown;
	};
	core?: {
		user_results?: {
			result?: {
				rest_id?: string;
				legacy?: { screen_name?: string };
			};
		};
	};
	views?: { count?: string };
}

const getUserInfo = (tweetResult: TweetResult) => {
	const userResult = tweetResult.core?.user_results?.result;
	return {
		authorId: userResult?.rest_id || "",
		authorScreenName: userResult?.legacy?.screen_name || "",
	};
};

export const convertTweetResultToMention = (tweetResult: TweetResult): XMention | null => {
	const legacy = tweetResult.legacy;
	if (!legacy) return null;

	const userInfo = getUserInfo(tweetResult);

	return {
		restId: tweetResult.rest_id,
		createdAt: legacy.created_at,
		text: legacy.text,
		authorId: userInfo.authorId,
		authorScreenName: userInfo.authorScreenName,
		inReplyToStatusId: legacy.in_reply_to_status_id_str,
		inReplyToUserId: legacy.in_reply_to_user_id_str,
		retweetCount: legacy.retweet_count || 0,
		favoriteCount: legacy.favorite_count || 0,
		replyCount: legacy.reply_count || 0,
		quoteCount: legacy.quote_count || 0,
		conversationId: legacy.conversation_id_str || "",
		lang: legacy.lang || "en",
		views: tweetResult.views?.count,
		hashtags: extractHashtags(legacy.entities as any),
		mentions: extractMentions(legacy.entities as any).map(m => ({ screenName: m.screenName, name: m.name, id: m.id, indices: m.indices })),
		urls: extractUrls(legacy.entities as any).map(u => ({ url: u.url, expandedUrl: u.expandedUrl, displayUrl: u.displayUrl, indices: u.indices })),
	};
};

export const extractTweetResultFromEntry = (entry: unknown): TweetResult | null => {
	return (entry as any)?.content?.itemContent?.tweet_results?.result || null;
};
