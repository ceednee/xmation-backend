import type { ScheduledJob } from "./types";

const handleSuccess = (job: ScheduledJob): void => {
	job.metrics.lastSuccessTime = Date.now();
};

const handleError = (job: ScheduledJob, error: unknown): void => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	console.error(`Job ${job.name} failed:`, errorMessage);
	job.metrics.lastErrorTime = Date.now();
	job.metrics.totalErrors++;
};

const finalizeExecution = (job: ScheduledJob, startTime: number): void => {
	job.metrics.executionCount++;
	job.metrics.lastExecutionTime = Date.now() - startTime;
	job.isRunning = false;
};

export const executeJob = async (
	job: ScheduledJob,
	onComplete: () => void
): Promise<void> => {
	if (job.isRunning) {
		console.log(`Job ${job.name} is already running, skipping`);
		return;
	}

	job.isRunning = true;
	const startTime = Date.now();

	try {
		await job.handler();
		handleSuccess(job);
	} catch (error) {
		handleError(job, error);
	} finally {
		finalizeExecution(job, startTime);
		onComplete();
	}
};
