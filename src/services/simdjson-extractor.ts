// SIMDJSON Extractor - High-performance JSON parsing for large responses
// Uses simdjson for 3-5x faster parsing compared to standard JSON.parse
// Used for: mentions, timeline, followers (large array responses)

import type { XFollower, XMention, XTweet } from "../types/rapidapi";

// Try to import simdjson, fallback to JSON.parse if not available
let simdjson: { parse: (json: string) => unknown } | null = null;
try {
	const simdjsonModule = require("simdjson");
	simdjson = simdjsonModule;
} catch (e) {
	console.warn(
		"[simdjson] Native module not available, using JSON.parse fallback",
	);
}

/**
 * Extract mentions from large JSON response using simdjson
 * Performance: ~3-5x faster than JSON.parse for large responses
 */
export function extractMentionsSimd(jsonString: string): XMention[] {
	try {
		// Parse with simdjson if available, otherwise use JSON.parse
		const doc = simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);

		const mentions: XMention[] = [];

		// Navigate to instructions array
		const instructions = doc.data?.timeline?.instructions;
		if (!Array.isArray(instructions)) return mentions;

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			const entries = instruction.entries;
			if (!Array.isArray(entries)) continue;

			for (const entry of entries) {
				const tweetResult = entry?.content?.itemContent?.tweet_results?.result;
				if (!tweetResult) continue;

				const legacy = tweetResult.legacy;
				if (!legacy) continue;

				const userResult = tweetResult.core?.user_results?.result;

				// Build mention object with only required fields
				mentions.push({
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
					hashtags:
						legacy.entities?.hashtags?.map((h: { text?: string }) =>
							String(h.text),
						) || [],
					mentions:
						legacy.entities?.user_mentions?.map(
							(m: {
								screen_name?: string;
								name?: string;
								id_str?: string;
								indices?: number[];
							}) => ({
								screenName: String(m.screen_name),
								name: String(m.name),
								id: String(m.id_str),
								indices: Array.isArray(m.indices) ? m.indices : [],
							}),
						) || [],
					urls:
						legacy.entities?.urls?.map(
							(u: {
								url?: string;
								expanded_url?: string;
								display_url?: string;
								indices?: number[];
							}) => ({
								url: String(u.url),
								expandedUrl: String(u.expanded_url),
								displayUrl: String(u.display_url),
								indices: Array.isArray(u.indices) ? u.indices : [],
							}),
						) || [],
				});
			}
		}

		return mentions;
	} catch (error) {
		console.error("[simdjson] Failed to extract mentions:", error);
		return [];
	}
}

/**
 * Extract followers using simdjson
 */
export function extractFollowersSimd(jsonString: string): XFollower[] {
	try {
		const doc = simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);
		const followers: XFollower[] = [];

		const instructions =
			doc.data?.user?.result?.timeline?.timeline?.instructions;
		if (!Array.isArray(instructions)) return followers;

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			const entries = instruction.entries;
			if (!Array.isArray(entries)) continue;

			for (const entry of entries) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				followers.push({
					restId: String(userResult.rest_id),
					screenName: String(legacy.screen_name),
					name: String(legacy.name),
					followersCount: Number(legacy.followers_count) || 0,
					verified: Boolean(legacy.verified),
					createdAt: String(legacy.created_at),
					followedBy: Boolean(userResult.followed_by),
					following: Boolean(userResult.following),
				});
			}
		}

		return followers;
	} catch (error) {
		console.error("[simdjson] Failed to extract followers:", error);
		return [];
	}
}

/**
 * Extract retweets using simdjson
 */
export function extractRetweetsSimd(jsonString: string, tweetId: string) {
	try {
		const doc = simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);
		const retweets: Array<{
			tweetId: string;
			retweeterId: string;
			retweeterScreenName: string;
			retweeterFollowersCount: number;
			totalRetweets: number;
		}> = [];

		const instructions = doc.data?.retweeters_timeline?.timeline?.instructions;
		if (!Array.isArray(instructions)) return retweets;

		const totalRetweets =
			Number(doc.data?.source_tweet?.legacy?.retweet_count) || 0;

		for (const instruction of instructions) {
			if (instruction.type !== "TimelineAddEntries") continue;

			const entries = instruction.entries;
			if (!Array.isArray(entries)) continue;

			for (const entry of entries) {
				const userResult = entry?.content?.itemContent?.user_results?.result;
				if (!userResult) continue;

				const legacy = userResult.legacy;
				if (!legacy) continue;

				retweets.push({
					tweetId,
					retweeterId: String(userResult.rest_id),
					retweeterScreenName: String(legacy.screen_name),
					retweeterFollowersCount: Number(legacy.followers_count) || 0,
					totalRetweets,
				});
			}
		}

		return retweets;
	} catch (error) {
		console.error("[simdjson] Failed to extract retweets:", error);
		return [];
	}
}

/**
 * Extract user profile using simdjson
 */
export function extractUserSimd(jsonString: string) {
	try {
		const doc = simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);

		const user = doc.data?.user?.result;
		if (!user) return null;

		const legacy = user.legacy;
		if (!legacy) return null;

		return {
			restId: String(user.rest_id),
			screenName: String(legacy.screen_name),
			name: String(legacy.name),
			followersCount: Number(legacy.followers_count) || 0,
			followingCount: Number(legacy.following_count) || 0,
			statusesCount: Number(legacy.statuses_count) || 0,
			createdAt: String(legacy.created_at),
			verified: Boolean(legacy.verified),
			pinnedTweetIds: legacy.pinned_tweet_ids_str || [],
			profileImageUrl: String(legacy.profile_image_url_https),
			description: String(legacy.description || ""),
			url: legacy.url,
		};
	} catch (error) {
		console.error("[simdjson] Failed to extract user:", error);
		return null;
	}
}

/**
 * Extract tweet using simdjson
 */
export function extractTweetSimd(jsonString: string): XTweet | null {
	try {
		const doc = simdjson ? simdjson.parse(jsonString) : JSON.parse(jsonString);

		const tweet = doc.data?.tweetResult;
		if (!tweet) return null;

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
			hashtags:
				legacy.entities?.hashtags?.map((h: { text?: string }) =>
					String(h.text),
				) || [],
			mentions:
				legacy.entities?.user_mentions?.map(
					(m: {
						screen_name?: string;
						name?: string;
						id_str?: string;
						indices?: number[];
					}) => ({
						screenName: String(m.screen_name),
						name: String(m.name),
						id: String(m.id_str),
						indices: Array.isArray(m.indices) ? m.indices : [],
					}),
				) || [],
			urls:
				legacy.entities?.urls?.map(
					(u: {
						url?: string;
						expanded_url?: string;
						display_url?: string;
						indices?: number[];
					}) => ({
						url: String(u.url),
						expandedUrl: String(u.expanded_url),
						displayUrl: String(u.display_url),
						indices: Array.isArray(u.indices) ? u.indices : [],
					}),
				) || [],
		};
	} catch (error) {
		console.error("[simdjson] Failed to extract tweet:", error);
		return null;
	}
}

/**
 * Benchmark: Compare simdjson vs standard JSON.parse
 * Use this to verify performance gains
 */
export function benchmarkParsing(
	jsonString: string,
	iterations = 100,
): {
	simdjsonTime: number;
	standardTime: number;
	speedup: number;
} {
	// simdjson benchmark
	const simdStart = performance.now();
	for (let i = 0; i < iterations; i++) {
		extractMentionsSimd(jsonString);
	}
	const simdTime = performance.now() - simdStart;

	// Standard JSON.parse benchmark
	const stdStart = performance.now();
	for (let i = 0; i < iterations; i++) {
		const doc = JSON.parse(jsonString);
		// Simple extraction
		const instructions = doc.data?.timeline?.instructions || [];
	}
	const stdTime = performance.now() - stdStart;

	return {
		simdjsonTime: simdTime,
		standardTime: stdTime,
		speedup: stdTime / simdTime,
	};
}

/**
 * Auto-select parser based on JSON size
 * - Small (< 10KB): Use standard JSON.parse (faster for small objects)
 * - Large (>= 10KB): Use simdjson (faster for large objects)
 */
export function autoSelectParser(jsonString: string): "simdjson" | "standard" {
	const sizeInKB = jsonString.length / 1024;
	return sizeInKB >= 10 ? "simdjson" : "standard";
}
