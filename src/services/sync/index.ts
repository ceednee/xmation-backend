/**
 * Sync Service Module
 * 
 * Manages synchronization of X (Twitter) data: mentions, followers, posts.
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
 * - `followers` - New followers
 * - `timeline` - User's own posts
 * - `full` - Complete refresh of all data
 * 
 * ## Module Structure
 * 
 * - `service.ts` - Main SyncService class
 * - `state.ts` - Sync state management
 * - `concurrency.ts` - Concurrency control
 * - `mentions.ts` - Mention sync operations
 * - `followers.ts` - Follower sync operations
 * - `posts.ts` - Timeline/post sync operations
 * - `legacy-sync.ts` - Backward compatibility wrapper
 * 
 * ## Usage
 * 
 * ```typescript
 * const syncService = new SyncService(userId);
 * 
 * // Sync mentions (incremental)
 * const result = await syncService.syncMentions();
 * console.log(result.newItems); // new mentions found
 * 
 * // Full sync
 * const result = await syncService.fullSync();
 * console.log(result.summary);
 * 
 * // Check status
 * const status = await syncService.getStatus();
 * console.log(status.lastSyncAt);
 * ```
 */

export { SyncService, syncService } from "./service";
export { syncMentions, syncFollowers, syncTimeline, fullSync } from "./legacy-sync";
export { getSyncStatus } from "./legacy-status";
export type { SyncType, SyncState, SyncResult, SyncOptions } from "./types";
