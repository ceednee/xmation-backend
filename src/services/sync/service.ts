/**
 * Sync Service
 * 
 * Manages synchronization of X (Twitter) data including mentions, followers, and posts.
 * Handles state tracking, concurrency control, and incremental syncing.
 * 
 * ## Key Concepts
 * 
 * - **Incremental Sync**: Only fetches new data since last sync
 * - **State Tracking**: Stores sync state (cursor/timestamp) per sync type
 * - **Concurrency Control**: Prevents overlapping syncs of same type
 * - **Rate Limiting**: Respects X API rate limits
 * 
 * ## Sync Types
 * 
 * - `mentions` - New mentions/replies to the user
 * - `followers` - Follower changes (new/unfollows)
 * - `posts` - User's own posts
 * 
 * ## Usage
 * 
 * ```typescript
 * const syncService = new SyncService();
 * 
 * // Sync mentions (incremental)
 * const result = await syncService.syncMentions(userId, xUserId);
 * console.log(result.newItems); // new mentions found
 * 
 * // Check if sync needed
 * const needsSync = await syncService.needsSync(userId, "mentions", 60000);
 * 
 * // Get sync state
 * const state = await syncService.getSyncState(userId, "mentions");
 * console.log(state.lastSyncAt);
 * ```
 */

import type { SyncType, SyncState, SyncOptions, SyncResult } from "./types";
import { SyncStateManager } from "./state";
import { SyncConcurrencyManager } from "./concurrency";
import { syncMentions } from "./mentions";
import { syncFollowers } from "./followers";
import { syncPosts } from "./posts";

/**
 * Main sync service class
 * Orchestrates data synchronization with state management
 */
export class SyncService {
	private stateManager: SyncStateManager = new SyncStateManager();
	private concurrencyManager: SyncConcurrencyManager = new SyncConcurrencyManager();

	/**
	 * Get the current sync state for a user and sync type
	 */
	async getSyncState(userId: string, syncType: SyncType): Promise<SyncState | null> {
		return this.stateManager.get(userId, syncType);
	}

	/**
	 * Record a completed sync operation
	 */
	async recordSync(
		userId: string,
		syncType: SyncType,
		data: { lastSyncAt: number; lastItemId?: string }
	): Promise<void> {
		return this.stateManager.record(userId, syncType, data);
	}

	/**
	 * Check if a sync is needed based on time interval
	 */
	async needsSync(userId: string, syncType: SyncType, intervalMs: number): Promise<boolean> {
		return this.stateManager.needsSync(userId, syncType, intervalMs);
	}

	/**
	 * Sync mentions for a user
	 */
	async syncMentions(userId: string, xUserId: string, options: SyncOptions = {}): Promise<SyncResult> {
		return syncMentions(userId, xUserId, options, this.concurrencyManager, this.recordSync.bind(this));
	}

	/**
	 * Sync followers for a user
	 */
	async syncFollowers(userId: string, xUserId: string, options: { mockData?: unknown[] } = {}): Promise<SyncResult> {
		return syncFollowers(userId, xUserId, options, this.concurrencyManager, this.recordSync.bind(this));
	}

	/**
	 * Sync posts/timeline for a user
	 */
	async syncPosts(userId: string, xUserId: string, options: { mockData?: unknown[] } = {}): Promise<SyncResult> {
		return syncPosts(userId, xUserId, options, this.concurrencyManager, this.recordSync.bind(this));
	}

	/**
	 * Get count of currently running sync operations
	 */
	getRunningSyncCount(): number {
		return this.concurrencyManager.getRunningCount();
	}
}

/**
 * Global sync service instance
 */
export const syncService = new SyncService();
