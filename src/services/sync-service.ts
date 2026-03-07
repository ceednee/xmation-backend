// Sync Service - Orchestrates data sync from RapidAPI to cache
// Based on docs/RAPIDAPI_PROPERTY_SELECTION.md

import type {
	XFollower,
	XMention,
	XRetweet,
	XTweet,
	XUser,
} from "../types/rapidapi";
import * as cache from "./cache";
import {
	detectNewFollowers,
	detectUnfollows,
	extractFollowers,
	extractMentions,
	extractRetweets,
	extractUser,
	findLastPostTime,
} from "./data-extractor";
import * as rapidApi from "./rapidapi-client";
import {
	autoSelectParser,
	extractFollowersSimd,
	extractMentionsSimd,
	extractUserSimd,
} from "./simdjson-extractor";

// Sync intervals (in minutes)
const SYNC_INTERVALS = {
	mentions: 5,
	replies: 5,
	retweets: 15,
	followers: 30,
	timeline: 15,
	links: 240, // 4 hours
};

/**
 * Sync user profile
 * Uses simdjson for parsing user profile data
 */
export async function syncUserProfile(
	userId: string,
	screenName: string,
): Promise<XUser | null> {
	const cacheKey = cache.cacheKey(userId, "user");

	// Check cache
	const cached = await cache.get<XUser>(cacheKey);
	if (cached) {
		console.log(`[Sync] Using cached user profile for ${screenName}`);
		return cached;
	}

	console.log(`[Sync] Fetching user profile for ${screenName}`);

	try {
		const response = await rapidApi.getUserByScreenName(screenName);

		// Convert to JSON string for simdjson parsing
		const jsonString = JSON.stringify(response);

		// Use simdjson for large responses
		const parserType = autoSelectParser(jsonString);
		console.log(
			`[Sync] Using ${parserType} parser for user profile (${(jsonString.length / 1024).toFixed(2)} KB)`,
		);

		const user =
			parserType === "simdjson"
				? extractUserSimd(jsonString)
				: extractUser(response);

		if (user) {
			await cache.set(cacheKey, user, SYNC_INTERVALS.timeline * 60);
		}

		return user;
	} catch (error) {
		console.error("[Sync] Failed to sync user profile:", error);
		return null;
	}
}

/**
 * Sync mentions
 * Uses simdjson for high-performance parsing of large responses
 */
export async function syncMentions(
	userId: string,
	sinceId?: string,
): Promise<XMention[]> {
	const cacheKey = cache.cacheKey(userId, "mentions");

	try {
		console.log(`[Sync] Fetching mentions for ${userId}`);

		// Fetch raw JSON string instead of parsed object
		const response = await rapidApi.getMentions("50");

		// Convert to JSON string for simdjson parsing
		// In real implementation, the API client would return the raw string
		const jsonString = JSON.stringify(response);

		// Use simdjson for large responses (>= 10KB)
		const parserType = autoSelectParser(jsonString);
		console.log(
			`[Sync] Using ${parserType} parser (${(jsonString.length / 1024).toFixed(2)} KB)`,
		);

		const mentions =
			parserType === "simdjson"
				? extractMentionsSimd(jsonString)
				: extractMentions(response);

		// Filter by sinceId if provided
		let newMentions = mentions;
		if (sinceId) {
			const sinceIndex = mentions.findIndex((m) => m.restId === sinceId);
			if (sinceIndex >= 0) {
				newMentions = mentions.slice(0, sinceIndex);
			}
		}

		// Cache all mentions
		await cache.set(cacheKey, mentions, SYNC_INTERVALS.mentions * 60);

		// Store last mention ID
		if (mentions.length > 0) {
			await cache.set(
				cache.cacheKey(userId, "mentions", "last_id"),
				mentions[0].restId,
				86400, // 24 hours
			);
		}

		console.log(`[Sync] Found ${newMentions.length} new mentions`);
		return newMentions;
	} catch (error) {
		console.error("[Sync] Failed to sync mentions:", error);
		return [];
	}
}

/**
 * Sync followers
 * Uses simdjson for high-performance parsing of large follower lists
 */
export async function syncFollowers(
	userId: string,
	xUserId: string,
): Promise<{
	followers: XFollower[];
	newFollowers: XFollower[];
	unfollows: XFollower[];
}> {
	const cacheKey = cache.cacheKey(userId, "followers");
	const previousKey = cache.cacheKey(userId, "followers", "previous");

	try {
		console.log(`[Sync] Fetching followers for ${userId}`);

		const response = await rapidApi.getFollowers(xUserId, "100");

		// Convert to JSON string for simdjson parsing
		const jsonString = JSON.stringify(response);

		// Use simdjson for large responses
		const parserType = autoSelectParser(jsonString);
		console.log(
			`[Sync] Using ${parserType} parser for followers (${(jsonString.length / 1024).toFixed(2)} KB)`,
		);

		const currentFollowers =
			parserType === "simdjson"
				? extractFollowersSimd(jsonString)
				: extractFollowers(response);

		// Get previous followers from cache
		const previousFollowers = (await cache.get<XFollower[]>(cacheKey)) || [];

		// Detect changes
		const newFollowers = detectNewFollowers(
			previousFollowers,
			currentFollowers,
		);
		const unfollows = detectUnfollows(previousFollowers, currentFollowers);

		// Update cache
		await cache.set(previousKey, previousFollowers, 86400);
		await cache.set(cacheKey, currentFollowers, SYNC_INTERVALS.followers * 60);

		// Store follower IDs as set for efficient lookup
		await cache.sadd(
			cache.cacheKey(userId, "followers", "ids"),
			...currentFollowers.map((f) => f.restId),
		);

		console.log(
			`[Sync] Followers: ${currentFollowers.length} total, ${newFollowers.length} new, ${unfollows.length} unfollows`,
		);

		return {
			followers: currentFollowers,
			newFollowers,
			unfollows,
		};
	} catch (error) {
		console.error("[Sync] Failed to sync followers:", error);
		return { followers: [], newFollowers: [], unfollows: [] };
	}
}

/**
 * Sync retweets for a specific tweet
 */
export async function syncRetweets(
	userId: string,
	tweetId: string,
): Promise<XRetweet[]> {
	const cacheKey = cache.cacheKey(userId, "retweets", tweetId);

	try {
		console.log(`[Sync] Fetching retweets for tweet ${tweetId}`);

		const response = await rapidApi.getRetweets(tweetId, "40");
		const retweets = extractRetweets(response, tweetId);

		await cache.set(cacheKey, retweets, SYNC_INTERVALS.retweets * 60);

		console.log(`[Sync] Found ${retweets.length} retweets`);
		return retweets;
	} catch (error) {
		console.error("[Sync] Failed to sync retweets:", error);
		return [];
	}
}

/**
 * Sync user timeline (for CONTENT_GAP detection)
 */
export async function syncTimeline(
	userId: string,
	screenName: string,
): Promise<{
	tweets: XTweet[];
	lastPostTime: number | undefined;
}> {
	const cacheKey = cache.cacheKey(userId, "timeline");

	try {
		console.log(`[Sync] Fetching timeline for ${screenName}`);

		const response = await rapidApi.getUserTimeline(screenName, "20");
		// Note: timeline response structure varies, need custom extraction
		const tweets: XTweet[] = []; // TODO: Implement timeline extraction

		const lastPostTime = findLastPostTime(tweets);

		await cache.set(
			cacheKey,
			{ tweets, lastPostTime },
			SYNC_INTERVALS.timeline * 60,
		);

		if (lastPostTime) {
			await cache.set(
				cache.cacheKey(userId, "timeline", "last_post_time"),
				lastPostTime,
				86400,
			);
		}

		console.log(
			`[Sync] Timeline: ${tweets.length} tweets, last post ${lastPostTime}`,
		);
		return { tweets, lastPostTime };
	} catch (error) {
		console.error("[Sync] Failed to sync timeline:", error);
		return { tweets: [], lastPostTime: undefined };
	}
}

/**
 * Get last mention ID from cache
 */
export async function getLastMentionId(
	userId: string,
): Promise<string | undefined> {
	const result = await cache.get<string>(
		cache.cacheKey(userId, "mentions", "last_id"),
	);
	return result ?? undefined;
}

/**
 * Get last post time from cache
 */
export async function getLastPostTime(
	userId: string,
): Promise<number | undefined> {
	const result = await cache.get<number>(
		cache.cacheKey(userId, "timeline", "last_post_time"),
	);
	return result ?? undefined;
}

/**
 * Get follower count from cache
 */
export async function getFollowerCount(userId: string): Promise<number> {
	const followers = await cache.get<XFollower[]>(
		cache.cacheKey(userId, "followers"),
	);
	return followers?.length || 0;
}

/**
 * Check if a user is following (cached)
 */
export async function isFollowing(
	userId: string,
	targetUserId: string,
): Promise<boolean> {
	const ids = await cache.smembers(cache.cacheKey(userId, "followers", "ids"));
	return ids.includes(targetUserId);
}

/**
 * Full sync - sync all data types
 */
export async function fullSync(
	userId: string,
	xUserId: string,
	screenName: string,
): Promise<{
	user: XUser | null;
	mentions: XMention[];
	followers: {
		followers: XFollower[];
		newFollowers: XFollower[];
		unfollows: XFollower[];
	};
	timeline: {
		tweets: XTweet[];
		lastPostTime: number | undefined;
	};
}> {
	console.log(`[Sync] Starting full sync for ${screenName}`);

	const [user, mentions, followers, timeline] = await Promise.all([
		syncUserProfile(userId, screenName),
		syncMentions(userId),
		syncFollowers(userId, xUserId),
		syncTimeline(userId, screenName),
	]);

	console.log(`[Sync] Full sync complete for ${screenName}`);

	return {
		user,
		mentions,
		followers,
		timeline,
	};
}

/**
 * Quick sync - only high-frequency data
 */
export async function quickSync(
	userId: string,
	xUserId: string,
): Promise<{
	mentions: XMention[];
	followers: {
		followers: XFollower[];
		newFollowers: XFollower[];
		unfollows: XFollower[];
	};
}> {
	const sinceId = await getLastMentionId(userId);

	const [mentions, followers] = await Promise.all([
		syncMentions(userId, sinceId),
		syncFollowers(userId, xUserId),
	]);

	return {
		mentions,
		followers,
	};
}

/**
 * Get sync status
 */
export async function getSyncStatus(userId: string): Promise<{
	lastMentionAt: number;
	lastFollowerSyncAt: number;
	lastTimelineSyncAt: number;
	cacheStats: ReturnType<typeof cache.getStats>;
}> {
	const now = Date.now();

	return {
		lastMentionAt:
			now - (await cache.ttl(cache.cacheKey(userId, "mentions"))) * 1000,
		lastFollowerSyncAt:
			now - (await cache.ttl(cache.cacheKey(userId, "followers"))) * 1000,
		lastTimelineSyncAt:
			now - (await cache.ttl(cache.cacheKey(userId, "timeline"))) * 1000,
		cacheStats: cache.getStats(),
	};
}
