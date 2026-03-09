export type SyncType = "mentions" | "followers" | "posts" | "timeline";

export interface SyncState {
	lastSyncAt: number;
	lastItemId?: string;
	errorCount: number;
	status: "idle" | "syncing" | "error";
}

export interface SyncOptions {
	sinceId?: string;
	mockData?: unknown[];
	mockError?: Error;
	mockRateLimitRemaining?: number;
}

export interface SyncResult {
	success: boolean;
	count: number;
	error?: string;
	mentions?: unknown[];
	posts?: unknown[];
	newFollowers?: unknown[];
	totalFollowers?: number;
}
