/**
 * @module cron-manager/executor
 * 
 * Job execution engine for the cron management system.
 * 
 * This module handles the actual execution of scheduled jobs, including
 * error handling, metrics tracking, and execution state management.
 * It prevents concurrent execution of the same job and provides
 * comprehensive logging for debugging purposes.
 * 
 * @example
 * ```typescript
 * import { executeJob } from "./executor";
 * import type { ScheduledJob } from "./types";
 * 
 * const job: ScheduledJob = {
 *   name: "example-job",
 *   interval: "* /5 * * * *", // every 5 minutes (space prevents comment close)
 *   handler: async () => { console.log("done"); },
 *   isRunning: false,
 *   metrics: { executionCount: 0, lastExecutionTime: 0, totalErrors: 0 }
 * };
 * 
 * await executeJob(job, () => {
 *   console.log("Job execution completed");
 * });
 * ```
 */

import type { ScheduledJob } from "./types";

/**
 * Updates job metrics after a successful execution.
 * 
 * @private
 * @param {ScheduledJob} job - The job that completed successfully
 * @returns {void}
 */
const handleSuccess = (job: ScheduledJob): void => {
	job.metrics.lastSuccessTime = Date.now();
};

/**
 * Handles error logging and metrics updates when a job fails.
 * 
 * Logs the error to console and updates the job's error tracking metrics.
 * 
 * @private
 * @param {ScheduledJob} job - The job that failed
 * @param {unknown} error - The error that was thrown
 * @returns {void}
 */
const handleError = (job: ScheduledJob, error: unknown): void => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	console.error(`Job ${job.name} failed:`, errorMessage);
	job.metrics.lastErrorTime = Date.now();
	job.metrics.totalErrors++;
};

/**
 * Finalizes job execution by updating metrics and resetting state.
 * 
 * Updates execution count, records execution duration, and clears
 * the running flag to allow the next execution.
 * 
 * @private
 * @param {ScheduledJob} job - The job being finalized
 * @param {number} startTime - Timestamp when execution started
 * @returns {void}
 */
const finalizeExecution = (job: ScheduledJob, startTime: number): void => {
	job.metrics.executionCount++;
	job.metrics.lastExecutionTime = Date.now() - startTime;
	job.isRunning = false;
};

/**
 * Executes a scheduled job with error handling and metrics tracking.
 * 
 * This function handles the complete job execution lifecycle:
 * 1. Checks if job is already running (prevents concurrent execution)
 * 2. Sets the running flag and records start time
 * 3. Executes the job handler
 * 4. Handles success/error cases appropriately
 * 5. Updates metrics and resets state
 * 6. Calls the completion callback
 * 
 * If the job is already running when called, it will be skipped
 * and a message will be logged.
 * 
 * @export
 * @param {ScheduledJob} job - The scheduled job to execute
 * @param {() => void} onComplete - Callback invoked after execution completes (success or failure)
 * @returns {Promise<void>}
 * @example
 * ```typescript
 * await executeJob(job, () => {
 *   // Schedule next execution
 *   scheduler.scheduleNext(job, executeFn);
 * });
 * ```
 */
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
