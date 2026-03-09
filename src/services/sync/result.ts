import type { SyncResult } from "./types";

export const createSuccessResult = (count: number, data?: Partial<SyncResult>): SyncResult => ({
	success: true,
	count,
	...data,
});

export const createErrorResult = (error: string): SyncResult => ({
	success: false,
	count: 0,
	error,
});

export const createInProgressResult = (): SyncResult =>
	createErrorResult("Sync already in progress");

export const createRateLimitResult = (): SyncResult =>
	createErrorResult("Rate limit exceeded");
