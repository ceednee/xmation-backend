/**
 * Mentions Sync
 * 
 * Handles synchronization of mentions (tweets mentioning the user).
 * 
 * ## Usage
 * 
 * ```typescript
 * const result = await syncMentions(
 *   userId,
 *   xUserId,
 *   { sinceId: "12345" },
 *   concurrencyManager,
 *   recordSync
 * );
 * ```
 */

import type { SyncOptions, SyncResult } from "./types";
import { createSuccessResult, createErrorResult, createInProgressResult, createRateLimitResult } from "./result";

/**
 * Sync mentions for a user
 * 
 * @param userId - Internal user ID
 * @param xUserId - X (Twitter) user ID
 * @param options - Sync options including sinceId and mock data
 * @param concurrencyManager - Concurrency manager instance
 * @param recordSync - Function to record sync completion
 * @returns Sync result
 */
export const syncMentions = async (
	userId: string,
	xUserId: string,
	options: SyncOptions,
	concurrencyManager: { isRunning: (key: string) => boolean; start: (key: string) => void; end: (key: string) => void },
	recordSync: (userId: string, syncType: "mentions", data: { lastSyncAt: number; lastItemId?: string }) => Promise<void>
): Promise<SyncResult> => {
	const syncKey = `${userId}:mentions`;

	if (concurrencyManager.isRunning(syncKey)) {
		return createInProgressResult();
	}

	concurrencyManager.start(syncKey);

	try {
		if (options.mockRateLimitRemaining === 0) {
			return createRateLimitResult();
		}

		if (options.mockError) {
			return createErrorResult(options.mockError.message);
		}

		const mentions = options.mockData || [];

		await recordSync(userId, "mentions", {
			lastSyncAt: Date.now(),
			lastItemId: mentions.length > 0 ? (mentions[0] as { id: string }).id : undefined,
		});

		return createSuccessResult(mentions.length, { mentions });
	} finally {
		concurrencyManager.end(syncKey);
	}
};
