/**
 * @module cron-manager/job-scheduler
 * 
 * Job scheduling and timer management.
 * 
 * This module provides the {@link JobScheduler} class which handles the
 * scheduling of job executions using JavaScript timeouts. It calculates
 * the next run time based on the cron expression and manages the
 * underlying timer infrastructure.
 * 
 * The scheduler works closely with the {@link getNextRunTime} function
 * from the scheduler module to determine when jobs should execute.
 * 
 * @example
 * ```typescript
 * import { JobScheduler } from "./job-scheduler";
 * 
 * const scheduler = new JobScheduler();
 * 
 * // Schedule next execution
 * scheduler.scheduleNext(job, async (name) => {
 *   await executeJob(name);
 * });
 * 
 * // Clear timeout when unscheduling
 * scheduler.clearTimeout(job);
 * ```
 */

import type { ScheduledJob } from "./types";
import { getNextRunTime } from "./scheduler";

/**
 * Manages the scheduling of job executions using timeouts.
 * 
 * This class handles the timing aspects of job execution:
 * - Calculating the next run time based on cron expressions
 * - Setting up JavaScript timeouts for job execution
 * - Clearing timeouts when jobs are unscheduled or need rescheduling
 * 
 * @class JobScheduler
 */
export class JobScheduler {
	/**
	 * Schedules the next execution of a job.
	 * 
	 * Calculates the delay until the next run time based on the job's
	 * cron interval expression, clears any existing timeout, and sets
	 * up a new timeout to execute the job.
	 * 
	 * @param {ScheduledJob} job - The job to schedule
	 * @param {(name: string) => Promise<void>} executeFn - Async function to call when the timer fires
	 * @returns {void}
	 * @example
	 * ```typescript
	 * scheduler.scheduleNext(job, async (jobName) => {
	 *   console.log(`Executing ${jobName}`);
	 *   await runJob(jobName);
	 * });
	 * ```
	 */
	scheduleNext(job: ScheduledJob, executeFn: (name: string) => Promise<void>): void {
		if (job.timeoutId) clearTimeout(job.timeoutId);
		const delay = getNextRunTime(job.interval) - Date.now();
		job.timeoutId = setTimeout(() => executeFn(job.name), Math.max(0, delay));
	}

	/**
	 * Clears the timeout for a scheduled job.
	 * 
	 * Cancels any pending execution for the job. This should be called
	 * when unscheduling a job to prevent it from executing after removal.
	 * 
	 * @param {ScheduledJob} job - The job whose timeout should be cleared
	 * @returns {void}
	 * @example
	 * ```typescript
	 * // Before removing a job, clear its timeout
	 * scheduler.clearTimeout(job);
	 * store.delete(job.name);
	 * ```
	 */
	clearTimeout(job: ScheduledJob): void {
		if (job.timeoutId) clearTimeout(job.timeoutId);
	}
}
