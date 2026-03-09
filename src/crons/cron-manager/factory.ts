import type { ScheduledJob } from "./types";

export const createJob = (
	name: string,
	interval: string,
	handler: () => Promise<void>
): ScheduledJob => ({
	name,
	interval,
	handler,
	isRunning: false,
	metrics: {
		executionCount: 0,
		lastExecutionTime: 0,
		totalErrors: 0,
	},
});
