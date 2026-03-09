/**
 * Legacy Sync Functions
 * 
 * Backward-compatible wrapper functions for sync operations.
 * Maintains the original API while using the new SyncService internally.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Sync mentions
 * const mentions = await syncMentions(userId, sinceId);
 * 
 * // Sync followers
 * const followers = await syncFollowers(userId, xUserId);
 * 
 * // Sync timeline
 * const timeline = await syncTimeline(userId, screenName);
 * 
 * // Full sync
 * const result = await fullSync(userId, xUserId, screenName);
 * ```
 */

import { syncService } from "./service";

/**
 * Sync mentions (legacy API)
 * 
 * @param userId - User ID
 * @param sinceId - Fetch mentions since this ID
 * @returns Array of mentions
 */
export async function syncMentions(
	userId: string,
	sinceId?: string
): Promise<Array<{ id: string; text: string; createdAt: number }>> {
	const result = await syncService.syncMentions(userId, userId, { sinceId });
	return (result.mentions as Array<{ id: string; text: string; createdAt: number }>) || [];
}

/**
 * Sync followers (legacy API)
 * 
 * @param userId - User ID
 * @param xUserId - X (Twitter) user ID
 * @returns Follower data with new followers and unfollows
 */
export async function syncFollowers(
	userId: string,
	xUserId: string
): Promise<{
	followers: Array<{ id: string; username: string }>;
	newFollowers: Array<{ id: string; username: string }>;
	unfollows: Array<{ id: string; username: string }>;
}> {
	const result = await syncService.syncFollowers(userId, xUserId);
	return {
		followers: (result.newFollowers as Array<{ id: string; username: string }>) || [],
		newFollowers: (result.newFollowers as Array<{ id: string; username: string }>) || [],
		unfollows: [],
	};
}

/**
 * Sync timeline/posts (legacy API)
 * 
 * @param userId - User ID
 * @param _screenName - Screen name (unused, kept for compatibility)
 * @returns Timeline data with tweets and last post time
 */
export async function syncTimeline(
	userId: string,
	_screenName: string
): Promise<{
	tweets: Array<{ id: string; text: string; createdAt: number }>;
	lastPostTime: number | null;
}> {
	const result = await syncService.syncPosts(userId, userId);
	const posts = (result.posts as Array<{ id: string; text: string; createdAt: number }>) || [];
	const lastPostTime = posts.length > 0 ? Math.max(...posts.map(p => p.createdAt)) : null;

	return { tweets: posts, lastPostTime };
}

/**
 * Full sync - sync all data types (legacy API)
 * 
 * @param userId - User ID
 * @param xUserId - X (Twitter) user ID
 * @param screenName - X screen name
 * @returns Complete sync results
 */
export async function fullSync(
	userId: string,
	xUserId: string,
	screenName: string
): Promise<{
	user: boolean;
	mentions: Array<unknown>;
	followers: {
		followers: Array<unknown>;
		newFollowers: Array<unknown>;
		unfollows: Array<unknown>;
	};
	timeline: {
		tweets: Array<unknown>;
		lastPostTime: number | null;
	};
}> {
	const [mentionsResult, followersResult, timelineResult] = await Promise.all([
		syncMentions(userId),
		syncFollowers(userId, xUserId),
		syncTimeline(userId, screenName),
	]);

	return {
		user: true,
		mentions: mentionsResult,
		followers: followersResult,
		timeline: timelineResult,
	};
}
