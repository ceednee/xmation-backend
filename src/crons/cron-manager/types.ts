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
