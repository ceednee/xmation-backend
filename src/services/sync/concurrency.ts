/**
 * Sync Concurrency Manager
 * 
 * Prevents overlapping sync operations of the same type.
 * Tracks running syncs in memory.
 * 
 * ## Usage
 * 
 * ```typescript
 * const manager = new SyncConcurrencyManager();
 * 
 * // Check if sync is running
 * if (manager.isRunning("user123:mentions")) {
 *   return; // Skip, already running
 * }
 * 
 * // Start a sync
 * manager.start("user123:mentions");
 * 
 * // End a sync
 * manager.end("user123:mentions");
 * 
 * // Get count of running syncs
 * const count = manager.getRunningCount();
 * ```
 */

/** Manages concurrent sync operations */
export class SyncConcurrencyManager {
	private runningSyncs: Set<string> = new Set();

	/**
	 * Check if a sync is currently running
	 * 
	 * @param syncKey - Unique sync key (e.g., "userId:syncType")
	 * @returns true if sync is running
	 */
	isRunning(syncKey: string): boolean {
		return this.runningSyncs.has(syncKey);
	}

	/**
	 * Mark a sync as started
	 * 
	 * @param syncKey - Unique sync key
	 */
	start(syncKey: string): void {
		this.runningSyncs.add(syncKey);
	}

	/**
	 * Mark a sync as ended
	 * 
	 * @param syncKey - Unique sync key
	 */
	end(syncKey: string): void {
		this.runningSyncs.delete(syncKey);
	}

	/**
	 * Get the number of currently running syncs
	 * 
	 * @returns Count of running syncs
	 */
	getRunningCount(): number {
		return this.runningSyncs.size;
	}
}
