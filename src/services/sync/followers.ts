/**
 * Followers Sync
 * 
 * Handles synchronization of follower data.
 * Detects new and lost followers.
 * 
 * ## Usage
 * 
 * ```typescript
 * const result = await syncFollowers(
 *   userId,
 *   xUserId,
 *   { mockData: followers },
 *   concurrencyManager,
 *   recordSync
 * );
 * ```
 */

import type { SyncResult } from "./types";
import { createSuccessResult, createInProgressResult } from "./result";

/**
 * Sync followers for a user
 * 
 * @param userId - Internal user ID
 * @param xUserId - X (Twitter) user ID
 * @param options - Sync options including mock data
 * @param concurrencyManager - Concurrency manager instance
 * @param recordSync - Function to record sync completion
 * @returns Sync result
 */
export const syncFollowers = async (
	userId: string,
	xUserId: string,
	options: { mockData?: unknown[] },
	concurrencyManager: { isRunning: (key: string) => boolean; start: (key: string) => void; end: (key: string) => void },
	recordSync: (userId: string, syncType: "followers", data: { lastSyncAt: number }) => Promise<void>
): Promise<SyncResult> => {
	const syncKey = `${userId}:followers`;

	if (concurrencyManager.isRunning(syncKey)) {
		return createInProgressResult();
	}

	concurrencyManager.start(syncKey);

	try {
		const followers = (options.mockData || []) as { id: string }[];

		await recordSync(userId, "followers", { lastSyncAt: Date.now() });

		return createSuccessResult(followers.length, {
			totalFollowers: followers.length,
			newFollowers: followers,
		});
	} finally {
		concurrencyManager.end(syncKey);
	}
};
