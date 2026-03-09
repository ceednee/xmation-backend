/**
 * Sync Service
 * 
 * Re-export from sync module for backward compatibility.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { SyncService, syncMentions, syncFollowers } from './sync-service';
 * 
 * // Use the service class
 * const syncService = new SyncService();
 * await syncService.syncMentions(userId, xUserId);
 * 
 * // Or use legacy functions
 * const mentions = await syncMentions(userId);
 * ```
 */

// Re-export from sync module for backward compatibility
export * from "./sync/index";
