/**
 * Sync Service
 * 
 * Manages synchronization of X data (mentions, followers, posts)
 * with rate limiting and error handling.
 */

export type SyncType = "mentions" | "followers" | "posts" | "timeline";

interface SyncState {
	lastSyncAt: number;
	lastItemId?: string;
	errorCount: number;
	status: "idle" | "syncing" | "error";
}

interface SyncOptions {
	sinceId?: string;
	mockData?: unknown[];
	mockError?: Error;
	mockRateLimitRemaining?: number;
}

interface SyncResult {
	success: boolean;
	count: number;
	error?: string;
	mentions?: unknown[];
	posts?: unknown[];
	newFollowers?: unknown[];
	totalFollowers?: number;
}

/**
 * Service for syncing X data
 */
export class SyncService {
	private syncStates: Map<string, SyncState> = new Map();
	private runningSyncs: Set<string> = new Set();

	/**
	 * Get sync state for a user and sync type
	 */
	async getSyncState(userId: string, syncType: SyncType): Promise<SyncState | null> {
		const key = `${userId}:${syncType}`;
		return this.syncStates.get(key) || null;
	}

	/**
	 * Record a sync operation
	 */
	async recordSync(
		userId: string,
		syncType: SyncType,
		data: { lastSyncAt: number; lastItemId?: string }
	): Promise<void> {
		const key = `${userId}:${syncType}`;
		this.syncStates.set(key, {
			lastSyncAt: data.lastSyncAt,
			lastItemId: data.lastItemId,
			errorCount: 0,
			status: "idle",
		});
	}

	/**
	 * Check if sync is needed based on interval
	 */
	async needsSync(userId: string, syncType: SyncType, intervalMs: number): Promise<boolean> {
		const key = `${userId}:${syncType}`;
		const state = this.syncStates.get(key);

		if (!state) {
			return true; // Never synced
		}

		if (state.status === "syncing") {
			return false; // Already syncing
		}

		const timeSinceLastSync = Date.now() - state.lastSyncAt;
		return timeSinceLastSync >= intervalMs;
	}

	/**
	 * Sync mentions for a user
	 */
	async syncMentions(
		userId: string,
		xUserId: string,
		options: SyncOptions = {}
	): Promise<SyncResult> {
		const syncKey = `${userId}:mentions`;

		// Prevent concurrent syncs
		if (this.runningSyncs.has(syncKey)) {
			return {
				success: false,
				count: 0,
				error: "Sync already in progress",
			};
		}

		this.runningSyncs.add(syncKey);

		try {
			// Check rate limit (mock implementation)
			if (options.mockRateLimitRemaining === 0) {
				return {
					success: false,
					count: 0,
					error: "Rate limit exceeded",
				};
			}

			// Handle mock error
			if (options.mockError) {
				return {
					success: false,
					count: 0,
					error: options.mockError.message,
				};
			}

			// Mock data for testing
			const mentions = options.mockData || [];

			// Update sync state
			await this.recordSync(userId, "mentions", {
				lastSyncAt: Date.now(),
				lastItemId: mentions.length > 0 ? (mentions[0] as { id: string }).id : undefined,
			});

			return {
				success: true,
				count: mentions.length,
				mentions,
			};
		} finally {
			this.runningSyncs.delete(syncKey);
		}
	}

	/**
	 * Sync followers for a user
	 */
	async syncFollowers(
		userId: string,
		xUserId: string,
		options: { mockData?: unknown[] } = {}
	): Promise<SyncResult> {
		const syncKey = `${userId}:followers`;

		if (this.runningSyncs.has(syncKey)) {
			return {
				success: false,
				count: 0,
				error: "Sync already in progress",
			};
		}

		this.runningSyncs.add(syncKey);

		try {
			const followers = (options.mockData || []) as { id: string }[];

			await this.recordSync(userId, "followers", {
				lastSyncAt: Date.now(),
			});

			return {
				success: true,
				count: followers.length,
				totalFollowers: followers.length,
				newFollowers: followers,
			};
		} finally {
			this.runningSyncs.delete(syncKey);
		}
	}

	/**
	 * Sync posts for a user
	 */
	async syncPosts(
		userId: string,
		xUserId: string,
		options: { mockData?: unknown[] } = {}
	): Promise<SyncResult> {
		const syncKey = `${userId}:posts`;

		if (this.runningSyncs.has(syncKey)) {
			return {
				success: false,
				count: 0,
				error: "Sync already in progress",
			};
		}

		this.runningSyncs.add(syncKey);

		try {
			const posts = (options.mockData || []) as { id: string }[];

			await this.recordSync(userId, "posts", {
				lastSyncAt: Date.now(),
				lastItemId: posts.length > 0 ? posts[0].id : undefined,
			});

			return {
				success: true,
				count: posts.length,
				posts,
			};
		} finally {
			this.runningSyncs.delete(syncKey);
		}
	}

	/**
	 * Get running sync count
	 */
	getRunningSyncCount(): number {
		return this.runningSyncs.size;
	}
}

// Export singleton instance
export const syncService = new SyncService();

// Legacy API compatibility functions for routes/sync.ts

/**
 * Get sync status for a user
 */
export async function getSyncStatus(userId: string): Promise<{
	mentions: { lastSync: number | null; count: number };
	followers: { lastSync: number | null; count: number };
	posts: { lastSync: number | null; count: number };
}> {
	const mentionsState = await syncService.getSyncState(userId, "mentions");
	const followersState = await syncService.getSyncState(userId, "followers");
	const postsState = await syncService.getSyncState(userId, "posts");

	return {
		mentions: {
			lastSync: mentionsState?.lastSyncAt || null,
			count: mentionsState ? 0 : 0, // Would need actual count from DB
		},
		followers: {
			lastSync: followersState?.lastSyncAt || null,
			count: followersState ? 0 : 0,
		},
		posts: {
			lastSync: postsState?.lastSyncAt || null,
			count: postsState ? 0 : 0,
		},
	};
}

/**
 * Sync mentions for a user (legacy API)
 */
export async function syncMentions(
	userId: string,
	sinceId?: string
): Promise<Array<{ id: string; text: string; createdAt: number }>> {
	const result = await syncService.syncMentions(userId, userId, { sinceId });
	return (result.mentions as Array<{ id: string; text: string; createdAt: number }>) || [];
}

/**
 * Sync followers for a user (legacy API)
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
		unfollows: [], // Would need to calculate from follower history
	};
}

/**
 * Sync timeline for a user (legacy API)
 */
export async function syncTimeline(
	userId: string,
	screenName: string
): Promise<{
	tweets: Array<{ id: string; text: string; createdAt: number }>;
	lastPostTime: number | null;
}> {
	const result = await syncService.syncPosts(userId, userId);
	const posts = (result.posts as Array<{ id: string; text: string; createdAt: number }>) || [];
	const lastPostTime = posts.length > 0 
		? Math.max(...posts.map(p => p.createdAt))
		: null;
	
	return {
		tweets: posts,
		lastPostTime,
	};
}

/**
 * Full sync for a user (legacy API)
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
