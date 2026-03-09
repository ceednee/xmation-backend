import type { SyncType, SyncState, SyncOptions, SyncResult } from "./types";
import { SyncStateManager } from "./state";
import { SyncConcurrencyManager } from "./concurrency";
import { syncMentions } from "./mentions";
import { syncFollowers } from "./followers";
import { syncPosts } from "./posts";

export class SyncService {
	private stateManager: SyncStateManager = new SyncStateManager();
	private concurrencyManager: SyncConcurrencyManager = new SyncConcurrencyManager();

	async getSyncState(userId: string, syncType: SyncType): Promise<SyncState | null> {
		return this.stateManager.get(userId, syncType);
	}

	async recordSync(
		userId: string,
		syncType: SyncType,
		data: { lastSyncAt: number; lastItemId?: string }
	): Promise<void> {
		return this.stateManager.record(userId, syncType, data);
	}

	async needsSync(userId: string, syncType: SyncType, intervalMs: number): Promise<boolean> {
		return this.stateManager.needsSync(userId, syncType, intervalMs);
	}

	async syncMentions(userId: string, xUserId: string, options: SyncOptions = {}): Promise<SyncResult> {
		return syncMentions(userId, xUserId, options, this.concurrencyManager, this.recordSync.bind(this));
	}

	async syncFollowers(userId: string, xUserId: string, options: { mockData?: unknown[] } = {}): Promise<SyncResult> {
		return syncFollowers(userId, xUserId, options, this.concurrencyManager, this.recordSync.bind(this));
	}

	async syncPosts(userId: string, xUserId: string, options: { mockData?: unknown[] } = {}): Promise<SyncResult> {
		return syncPosts(userId, xUserId, options, this.concurrencyManager, this.recordSync.bind(this));
	}

	getRunningSyncCount(): number {
		return this.concurrencyManager.getRunningCount();
	}
}

export const syncService = new SyncService();
