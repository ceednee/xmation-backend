import type { SyncResult } from "./types";
import { createSuccessResult, createInProgressResult } from "./result";

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
