import { syncService } from "./service";

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
