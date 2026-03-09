/**
 * Sync Types
 * 
 * Type definitions for the synchronization service.
 * 
 * ## Usage
 * 
 * ```typescript
 * import type { SyncType, SyncState, SyncResult, SyncOptions } from './types';
 * 
 * const syncType: SyncType = "mentions";
 * const state: SyncState = { lastSyncAt: Date.now(), errorCount: 0, status: "idle" };
 * ```
 */

/** Types of data that can be synced */
export type SyncType = "mentions" | "followers" | "posts" | "timeline";

/** Current state of a sync operation */
export interface SyncState {
	/** Timestamp of last successful sync */
	lastSyncAt: number;
	/** ID of the most recent item synced */
	lastItemId?: string;
	/** Number of consecutive errors */
	errorCount: number;
	/** Current sync status */
	status: "idle" | "syncing" | "error";
}

/** Options for sync operations */
export interface SyncOptions {
	/** Fetch items since this ID */
	sinceId?: string;
	/** Mock data for testing */
	mockData?: unknown[];
	/** Mock error for testing */
	mockError?: Error;
	/** Mock rate limit remaining for testing */
	mockRateLimitRemaining?: number;
}

/** Result of a sync operation */
export interface SyncResult {
	/** Whether sync was successful */
	success: boolean;
	/** Number of items synced */
	count: number;
	/** Error message if failed */
	error?: string;
	/** Synced mentions */
	mentions?: unknown[];
	/** Synced posts */
	posts?: unknown[];
	/** New followers detected */
	newFollowers?: unknown[];
	/** Total followers count */
	totalFollowers?: number;
}
