/**
 * Posts Sync
 * 
 * Handles synchronization of user's own posts/timeline.
 * 
 * ## Usage
 * 
 * ```typescript
 * const result = await syncPosts(
 *   userId,
 *   xUserId,
 *   { mockData: posts },
 *   concurrencyManager,
 *   recordSync
 * );
 * ```
 */

import type { SyncResult } from "./types";
import { createSuccessResult, createInProgressResult } from "./result";

/**
 * Sync posts for a user
 * 
 * @param userId - Internal user ID
 * @param xUserId - X (Twitter) user ID
 * @param options - Sync options including mock data
 * @param concurrencyManager - Concurrency manager instance
 * @param recordSync - Function to record sync completion
 * @returns Sync result
 */
export const syncPosts = async (
	userId: string,
	xUserId: string,
	options: { mockData?: unknown[] },
	concurrencyManager: { isRunning: (key: string) => boolean; start: (key: string) => void; end: (key: string) => void },
	recordSync: (userId: string, syncType: "posts", data: { lastSyncAt: number; lastItemId?: string }) => Promise<void>
): Promise<SyncResult> => {
	const syncKey = `${userId}:posts`;

	if (concurrencyManager.isRunning(syncKey)) {
		return createInProgressResult();
	}

	concurrencyManager.start(syncKey);

	try {
		const posts = (options.mockData || []) as { id: string }[];

		await recordSync(userId, "posts", {
			lastSyncAt: Date.now(),
			lastItemId: posts.length > 0 ? posts[0].id : undefined,
		});

		return createSuccessResult(posts.length, { posts });
	} finally {
		concurrencyManager.end(syncKey);
	}
};
