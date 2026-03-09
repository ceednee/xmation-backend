/**
 * Sync State Manager
 * 
 * Manages sync state persistence for tracking last sync times.
 * Uses in-memory storage (can be extended to use database).
 * 
 * ## Usage
 * 
 * ```typescript
 * const stateManager = new SyncStateManager();
 * 
 * // Get current state
 * const state = await stateManager.get(userId, "mentions");
 * 
 * // Record a sync
 * await stateManager.record(userId, "mentions", { lastSyncAt: Date.now() });
 * 
 * // Check if sync is needed
 * const needsSync = await stateManager.needsSync(userId, "mentions", 60000);
 * ```
 */

import type { SyncType, SyncState } from "./types";

/** Manages sync state for users */
export class SyncStateManager {
	private syncStates: Map<string, SyncState> = new Map();

	/**
	 * Generate storage key for user and sync type
	 * 
	 * @param userId - User ID
	 * @param syncType - Type of sync
	 * @returns Storage key
	 */
	getKey(userId: string, syncType: SyncType): string {
		return `${userId}:${syncType}`;
	}

	/**
	 * Get sync state for a user
	 * 
	 * @param userId - User ID
	 * @param syncType - Type of sync
	 * @returns Sync state or null if not found
	 */
	async get(userId: string, syncType: SyncType): Promise<SyncState | null> {
		return this.syncStates.get(this.getKey(userId, syncType)) || null;
	}

	/**
	 * Record a completed sync
	 * 
	 * @param userId - User ID
	 * @param syncType - Type of sync
	 * @param data - Sync data (timestamp and optional item ID)
	 */
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

	/**
	 * Check if a sync is needed based on time interval
	 * 
	 * @param userId - User ID
	 * @param syncType - Type of sync
	 * @param intervalMs - Minimum interval between syncs in milliseconds
	 * @returns true if sync is needed
	 */
	async needsSync(userId: string, syncType: SyncType, intervalMs: number): Promise<boolean> {
		const state = await this.get(userId, syncType);

		if (!state) return true;
		if (state.status === "syncing") return false;

		const timeSinceLastSync = Date.now() - state.lastSyncAt;
		return timeSinceLastSync >= intervalMs;
	}
}
