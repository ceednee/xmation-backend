export interface JobMetrics {
	executionCount: number;
	lastExecutionTime: number;
	lastSuccessTime?: number;
	lastErrorTime?: number;
	totalErrors: number;
}

export interface ScheduledJob {
	name: string;
	interval: string;
	handler: () => Promise<void>;
	isRunning: boolean;
	metrics: JobMetrics;
	timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * @deprecated Use ScheduledJob instead
 */
export type CronJob = ScheduledJob;

export interface CronSchedule {
	expression: string;
	timezone?: string;
}

export interface CronManagerOptions {
	enabled?: boolean;
	defaultTimezone?: string;
}
