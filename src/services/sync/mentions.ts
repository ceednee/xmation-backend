import type { SyncOptions, SyncResult } from "./types";
import { createSuccessResult, createErrorResult, createInProgressResult, createRateLimitResult } from "./result";

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
