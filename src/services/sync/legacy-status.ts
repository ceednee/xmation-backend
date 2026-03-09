/**
 * Legacy Sync Status
 * 
 * Backward-compatible sync status function.
 * Provides status across all sync types.
 * 
 * ## Usage
 * 
 * ```typescript
 * const status = await getSyncStatus(userId);
 * console.log(status.mentions.lastSync);
 * console.log(status.followers.count);
 * ```
 */

import { syncService } from "./service";

/**
 * Get sync status for all types for a user
 * 
 * @param userId - User ID
 * @returns Status object with mentions, followers, and posts info
 */
export async function getSyncStatus(userId: string): Promise<{
	mentions: { lastSync: number | null; count: number };
	followers: { lastSync: number | null; count: number };
	posts: { lastSync: number | null; count: number };
}> {
	const [mentionsState, followersState, postsState] = await Promise.all([
		syncService.getSyncState(userId, "mentions"),
		syncService.getSyncState(userId, "followers"),
		syncService.getSyncState(userId, "posts"),
	]);

	return {
		mentions: { lastSync: mentionsState?.lastSyncAt || null, count: 0 },
		followers: { lastSync: followersState?.lastSyncAt || null, count: 0 },
		posts: { lastSync: postsState?.lastSyncAt || null, count: 0 },
	};
}
