import type { SyncType, SyncState } from "./types";

export class SyncStateManager {
	private syncStates: Map<string, SyncState> = new Map();

	getKey(userId: string, syncType: SyncType): string {
		return `${userId}:${syncType}`;
	}

	async get(userId: string, syncType: SyncType): Promise<SyncState | null> {
		return this.syncStates.get(this.getKey(userId, syncType)) || null;
	}

	async record(
		userId: string,
		syncType: SyncType,
		data: { lastSyncAt: number; lastItemId?: string }
	): Promise<void> {
		this.syncStates.set(this.getKey(userId, syncType), {
			lastSyncAt: data.lastSyncAt,
			lastItemId: data.lastItemId,
			errorCount: 0,
			status: "idle",
		});
	}

	async needsSync(userId: string, syncType: SyncType, intervalMs: number): Promise<boolean> {
		const state = await this.get(userId, syncType);

		if (!state) return true;
		if (state.status === "syncing") return false;

		const timeSinceLastSync = Date.now() - state.lastSyncAt;
		return timeSinceLastSync >= intervalMs;
	}
}
