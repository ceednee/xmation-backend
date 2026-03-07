// Data Extractor - Extract selected properties from RapidAPI responses
// Based on docs/RAPIDAPI_PROPERTY_SELECTION.md

import type {
	RapidApiFollowersResponse,
	RapidApiMentionsResponse,
	RapidApiRetweetsResponse,
	RapidApiTweetResponse,
	RapidApiUserResponse,
	XFollower,
	XMention,
	XRetweet,
	XTweet,
	XUser,
} from "../types/rapidapi";

/**
 * Extract user profile from RapidAPI response
 */
export function extractUser(data: RapidApiUserResponse): XUser | null {
	try {
		const user = data?.data?.user?.result;
		if (!user) return null;

		const legacy = user.legacy;
		if (!legacy) return null;

		return {
			restId: user.rest_id,
			screenName: legacy.screen_name,
			name: legacy.name,
			followersCount: legacy.followers_count || 0,
			followingCount: legacy.following_count || 0,
			statusesCount: legacy.statuses_count || 0,
			createdAt: legacy.created_at,
			verified: legacy.verified || false,
			pinnedTweetIds: legacy.pinned_tweet_ids_str || [],
			profileImageUrl: legacy.profile_image_url_https,
			description: legacy.description || "",
			url: legacy.url,
		};
	} catch (error) {
		console.error("Failed to extract user:", error);
		return null;
	}
}

/**
 * Extract tweet from RapidAPI response
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
			hashtags: legacy.entities?.hashtags?.map((h) => h.text) || [],
			mentions:
				legacy.entities?.user_mentions?.map((m) => ({
					screenName: m.screen_name,
					name: m.name,
					id: m.id_str,
					indices: m.indices,
				})) || [],
			urls:
				legacy.entities?.urls?.map((u) => ({
					url: u.url,
					expandedUrl: u.expanded_url,
					displayUrl: u.display_url,
					indices: u.indices,
				})) || [],
		};
	} catch (error) {
		console.error("Failed to extract tweet:", error);
		return null;
	}
}

/**
 * Extract mentions from timeline response
 */
export function extractMentions(data: RapidApiMentionsResponse): XMention[] {
	try {
		const mentions: XMention[] = [];

		const instructions = data?.data?.timeline?.instructions || [];

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			const entries = instruction.entries || [];

			for (const entry of entries) {
				const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
				if (!tweetResult) continue;

				const legacy = tweetResult.legacy;
				if (!legacy) continue;

				const userResult = tweetResult.core?.user_results?.result;

				mentions.push({
					restId: tweetResult.rest_id,
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
					views: tweetResult.views?.count,
					hashtags: legacy.entities?.hashtags?.map((h) => h.text) || [],
					mentions:
						legacy.entities?.user_mentions?.map((m) => ({
							screenName: m.screen_name,
							name: m.name,
							id: m.id_str,
							indices: m.indices,
						})) || [],
					urls:
						legacy.entities?.urls?.map((u) => ({
							url: u.url,
							expandedUrl: u.expanded_url,
							displayUrl: u.display_url,
							indices: u.indices,
						})) || [],
				});
			}
		}

		return mentions;
	} catch (error) {
		console.error("Failed to extract mentions:", error);
		return [];
	}
}

/**
 * Extract followers from response
 */
export function extractFollowers(data: RapidApiFollowersResponse): XFollower[] {
	try {
		const followers: XFollower[] = [];

		const instructions =
			data?.data?.user?.result?.timeline?.timeline?.instructions || [];

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			const entries = instruction.entries || [];

			for (const entry of entries) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				followers.push({
					restId: userResult.rest_id,
					screenName: legacy.screen_name,
					name: legacy.name,
					followersCount: legacy.followers_count || 0,
					verified: legacy.verified || false,
					createdAt: legacy.created_at,
					followedBy: userResult.followed_by || false,
					following: userResult.following || false,
				});
			}
		}

		return followers;
	} catch (error) {
		console.error("Failed to extract followers:", error);
		return [];
	}
}

/**
 * Extract retweets from response
 */
export function extractRetweets(
	data: RapidApiRetweetsResponse,
	tweetId: string,
): XRetweet[] {
	try {
		const retweets: XRetweet[] = [];

		const instructions =
			data?.data?.retweeters_timeline?.timeline?.instructions || [];

		const totalRetweets = data?.data?.source_tweet?.legacy?.retweet_count || 0;

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			const entries = instruction.entries || [];

			for (const entry of entries) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				retweets.push({
					tweetId,
					retweeterId: userResult.rest_id,
					retweeterScreenName: legacy.screen_name,
					retweeterFollowersCount: legacy.followers_count || 0,
					totalRetweets,
				});
			}
		}

		return retweets;
	} catch (error) {
		console.error("Failed to extract retweets:", error);
		return [];
	}
}

/**
 * Calculate total engagement for a tweet
 */
export function calculateEngagement(tweet: XTweet): {
	likes: number;
	replies: number;
	retweets: number;
	quotes: number;
	total: number;
	views?: number;
} {
	const likes = tweet.favoriteCount || 0;
	const replies = tweet.replyCount || 0;
	const retweets = tweet.retweetCount || 0;
	const quotes = tweet.quoteCount || 0;
	const views = tweet.views ? Number.parseInt(tweet.views, 10) : undefined;

	return {
		likes,
		replies,
		retweets,
		quotes,
		total: likes + replies + retweets + quotes,
		views,
	};
}

/**
 * Find last post time from tweets array
 */
export function findLastPostTime(tweets: XTweet[]): number | undefined {
	if (tweets.length === 0) return undefined;

	const timestamps = tweets.map((t) => new Date(t.createdAt).getTime());
	return Math.max(...timestamps);
}

/**
 * Detect unfollows by comparing follower lists
 */
export function detectUnfollows(
	previousFollowers: XFollower[],
	currentFollowers: XFollower[],
): XFollower[] {
	const currentIds = new Set(currentFollowers.map((f) => f.restId));
	return previousFollowers.filter((f) => !currentIds.has(f.restId));
}

/**
 * Detect new followers by comparing follower lists
 */
export function detectNewFollowers(
	previousFollowers: XFollower[],
	currentFollowers: XFollower[],
): XFollower[] {
	const previousIds = new Set(previousFollowers.map((f) => f.restId));
	return currentFollowers.filter((f) => !previousIds.has(f.restId));
}

/**
 * Check if tweet contains negative sentiment
 */
export function detectNegativeSentiment(
	text: string,
	negativeWords: string[] = [
		"terrible",
		"awful",
		"bad",
		"hate",
		"worst",
		"suck",
		"disappointing",
		"angry",
		"frustrated",
		"annoying",
		"horrible",
		"disgusting",
		"pathetic",
		"useless",
		"stupid",
	],
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

/**
 * Extract all URLs from user profile and tweets
 */
export function extractAllUrls(
	user: XUser,
	tweets: XTweet[],
): Array<{ url: string; source: "bio" | "tweet"; tweetId?: string }> {
	const urls: Array<{
		url: string;
		source: "bio" | "tweet";
		tweetId?: string;
	}> = [];

	// Bio URL
	if (user.url) {
		urls.push({ url: user.url, source: "bio" });
	}

	// Tweet URLs
	for (const tweet of tweets) {
		for (const urlEntity of tweet.urls) {
			urls.push({
				url: urlEntity.expandedUrl,
				source: "tweet",
				tweetId: tweet.restId,
			});
		}
	}

	return urls;
}

/**
 * Parse time string to milliseconds
 */
export function parseTimeString(timeStr: string): number {
	const match = timeStr.match(/^(\d+)([smh])$/);
	if (!match) return 0;

	const value = Number.parseInt(match[1], 10);
	const unit = match[2];

	switch (unit) {
		case "s":
			return value * 1000;
		case "m":
			return value * 60 * 1000;
		case "h":
			return value * 60 * 60 * 1000;
		default:
			return 0;
	}
}
