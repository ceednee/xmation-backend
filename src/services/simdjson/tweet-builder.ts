import type { XMention, XTweet } from "../../types/rapidapi";
import { extractHashtags, extractMentions, extractUrls } from "./entities";

interface TweetLegacy {
	created_at?: string;
	text?: string;
	in_reply_to_status_id_str?: string;
	in_reply_to_user_id_str?: string;
	retweet_count?: number;
	favorite_count?: number;
	reply_count?: number;
	quote_count?: number;
	conversation_id_str?: string;
	lang?: string;
	entities?: unknown;
}

interface UserResult {
	rest_id?: string;
	legacy?: { screen_name?: string };
}

interface TweetResult {
	rest_id?: string;
	legacy?: TweetLegacy;
	core?: { user_results?: { result?: UserResult } };
	views?: { count?: string };
}

const buildMentionFromTweet = (tweetResult: TweetResult): XMention | null => {
	const legacy = tweetResult.legacy;
	if (!legacy) return null;

	const userResult = tweetResult.core?.user_results?.result;

	return {
		restId: String(tweetResult.rest_id),
		createdAt: String(legacy.created_at),
		text: String(legacy.text),
		authorId: String(userResult?.rest_id || ""),
		authorScreenName: String(userResult?.legacy?.screen_name || ""),
		inReplyToStatusId: legacy.in_reply_to_status_id_str,
		inReplyToUserId: legacy.in_reply_to_user_id_str,
		retweetCount: Number(legacy.retweet_count) || 0,
		favoriteCount: Number(legacy.favorite_count) || 0,
		replyCount: Number(legacy.reply_count) || 0,
		quoteCount: Number(legacy.quote_count) || 0,
		conversationId: String(legacy.conversation_id_str),
		lang: String(legacy.lang || "en"),
		views: tweetResult.views?.count,
		hashtags: extractHashtags(legacy.entities as any),
		mentions: extractMentions(legacy.entities as any),
		urls: extractUrls(legacy.entities as any),
	};
};

const buildTweetFromResult = (tweet: TweetResult): XTweet | null => {
	const legacy = tweet.legacy;
	if (!legacy) return null;

	const userResult = tweet.core?.user_results?.result;

	return {
		restId: String(tweet.rest_id),
		createdAt: String(legacy.created_at),
		text: String(legacy.text),
		authorId: String(userResult?.rest_id || ""),
		authorScreenName: String(userResult?.legacy?.screen_name || ""),
		inReplyToStatusId: legacy.in_reply_to_status_id_str,
		inReplyToUserId: legacy.in_reply_to_user_id_str,
		retweetCount: Number(legacy.retweet_count) || 0,
		favoriteCount: Number(legacy.favorite_count) || 0,
		replyCount: Number(legacy.reply_count) || 0,
		quoteCount: Number(legacy.quote_count) || 0,
		conversationId: String(legacy.conversation_id_str),
		lang: String(legacy.lang || "en"),
		views: tweet.views?.count,
		hashtags: extractHashtags(legacy.entities as any),
		mentions: extractMentions(legacy.entities as any),
		urls: extractUrls(legacy.entities as any),
	};
};

export const convertToMention = (tweetResult: unknown): XMention | null => {
	return buildMentionFromTweet(tweetResult as TweetResult);
};

export const convertToTweet = (tweetResult: unknown): XTweet | null => {
	return buildTweetFromResult(tweetResult as TweetResult);
};
