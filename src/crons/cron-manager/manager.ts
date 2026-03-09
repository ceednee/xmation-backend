/**
 * @module cron-manager/manager
 * 
 * Main cron job manager implementation.
 * 
 * This module provides the {@link CronJobManager} class, which is the primary
 * interface for scheduling, managing, and executing cron jobs. It coordinates
 * between the job store, scheduler, executor, and validation components to
 * provide a complete cron management solution.
 * 
 * The manager supports:
 * - Scheduling jobs with cron expressions
 * - Unscheduling (removing) jobs
 * - Manual job execution
 * - Metrics tracking and retrieval
 * - Cron expression validation
 * - Graceful shutdown with stopAll()
 * 
 * A singleton instance {@link cronManager} is exported for convenience.
 * 
 * @example
 * ```typescript
 * import { CronJobManager, cronManager } from "./manager";
 * 
 * // Use the singleton
 * await cronManager.schedule("backup", "0 2 * * *", async () => {
 *   await runBackup();
 * });
 * 
 * // Or create a new instance
 * const manager = new CronJobManager();
 * await manager.schedule("report", "0 9 * * 1", async () => {
 *   await generateWeeklyReport();
 * });
 * 
 * // Get job metrics
 * const metrics = manager.getJobMetrics("backup");
 * console.log(`Executed ${metrics?.executionCount} times`);
 * 
 * // List all jobs
 * const jobs = manager.getScheduledJobs();
 * 
 * // Cleanup on shutdown
 * manager.stopAll();
 * ```
 */

import type { JobMetrics } from "./types";
import { validateCronExpression } from "./validation";
import { JobStore } from "./job-store";
import { JobScheduler } from "./job-scheduler";
import { createJob } from "./factory";
import { executeJob } from "./executor";

/**
 * Main class for managing scheduled cron jobs.
 * 
 * The CronJobManager orchestrates all aspects of job scheduling:
 * - Stores job definitions and state
 * - Calculates and manages execution schedules
 * - Executes jobs and tracks metrics
 * - Provides validation and utility methods
 * 
 * @class CronJobManager
 */
export class CronJobManager {
	/**
	 * Internal storage for scheduled jobs.
	 * @private
	 * @type {JobStore}
	 */
	private store: JobStore = new JobStore();

	/**
	 * Scheduler for managing job execution timers.
	 * @private
	 * @type {JobScheduler}
	 */
	private scheduler: JobScheduler = new JobScheduler();

	/**
	 * Schedules a new recurring job.
	 * 
	 * Validates the cron expression, creates a job instance, stores it,
	 * and schedules its first execution.
	 * 
	 * @param {string} name - Unique identifier for the job
	 * @param {string} interval - Cron expression defining the schedule
	 * @param {() => Promise<void>} handler - Async function to execute on schedule
	 * @returns {Promise<void>}
	 * @throws {Error} If the cron expression is invalid
	 * @example
	 * ```typescript
	 * await manager.schedule("daily-report", "0 9 * * *", async () => {
	 *   const data = await fetchDailyData();
	 *   await sendEmailReport(data);
	 * });
	 * ```
	 */
	async schedule(name: string, interval: string, handler: () => Promise<void>): Promise<void> {
		if (!validateCronExpression(interval)) {
			throw new Error(`Invalid cron expression: ${interval}`);
		}
		const job = createJob(name, interval, handler);
		this.store.set(name, job);
		this.scheduler.scheduleNext(job, (n) => this.executeJob(n));
	}

	/**
	 * Removes a scheduled job.
	 * 
	 * Clears any pending timeout for the job and removes it from storage.
	 * If the job doesn't exist, this method completes silently.
	 * 
	 * @param {string} name - The name of the job to unschedule
	 * @returns {Promise<void>}
	 * @example
	 * ```typescript
	 * await manager.unschedule("daily-report");
	 * ```
	 */
	async unschedule(name: string): Promise<void> {
		const job = this.store.get(name);
		if (job) this.scheduler.clearTimeout(job);
		this.store.delete(name);
	}

	/**
	 * Manually triggers execution of a scheduled job.
	 * 
	 * Finds the job by name and executes it immediately, then reschedules
	 * the next execution based on the job's interval.
	 * 
	 * @param {string} name - The name of the job to execute
	 * @returns {Promise<void>}
	 * @throws {Error} If the job is not found
	 * @example
	 * ```typescript
	 * // Manually run a job outside its normal schedule
	 * await manager.executeJob("daily-report");
	 * ```
	 */
	async executeJob(name: string): Promise<void> {
		const job = this.store.get(name);
		if (!job) throw new Error(`Job not found: ${name}`);
		
		await executeJob(job, () => this.scheduler.scheduleNext(job, (n) => this.executeJob(n)));
	}

	/**
	 * Returns a list of all scheduled jobs.
	 * 
	 * Returns basic information (name and interval) for all registered jobs.
	 * For detailed metrics, use {@link getJobMetrics}.
	 * 
	 * @returns {Array<{ name: string; interval: string }>} Array of job summaries
	 * @example
	 * ```typescript
	 * const jobs = manager.getScheduledJobs();
	 * console.log(`Registered jobs: ${jobs.map(j => j.name).join(", ")}`);
	 * ```
	 */
	getScheduledJobs(): Array<{ name: string; interval: string }> {
		return Array.from(this.store.values()).map(job => ({
			name: job.name,
			interval: job.interval,
		}));
	}

	/**
	 * Retrieves metrics for a specific job.
	 * 
	 * @param {string} name - The name of the job
	 * @returns {JobMetrics | undefined} The job's metrics, or undefined if not found
	 * @example
	 * ```typescript
	 * const metrics = manager.getJobMetrics("daily-report");
	 * if (metrics) {
	 *   console.log(`Executed: ${metrics.executionCount} times`);
	 *   console.log(`Errors: ${metrics.totalErrors}`);
	 *   console.log(`Last run: ${new Date(metrics.lastExecutionTime)}`);
	 * }
	 * ```
	 */
	getJobMetrics(name: string): JobMetrics | undefined {
		return this.store.get(name)?.metrics;
	}

	/**
	 * Validates a cron expression.
	 * 
	 * Utility method to check if a cron expression is valid before scheduling.
	 * Delegates to the validation module.
	 * 
	 * @param {string} expression - The cron expression to validate
	 * @returns {boolean} True if the expression is valid
	 * @example
	 * ```typescript
	 * if (manager.validateCronExpression("0 9 * * *")) {
	 *   await manager.schedule("job", "0 9 * * *", handler);
	 * }
	 * ```
	 */
	validateCronExpression(expression: string): boolean {
		return validateCronExpression(expression);
	}

	/**
	 * Stops all scheduled jobs and clears storage.
	 * 
	 * Clears all pending timeouts, removes all jobs from storage, and
	 * resets the manager to a clean state. This should be called during
	 * application shutdown to prevent memory leaks and dangling timers.
	 * 
	 * @returns {void}
	 * @example
	 * ```typescript
	 * // On application shutdown
	 * process.on("SIGTERM", () => {
	 *   manager.stopAll();
	 *   process.exit(0);
	 * });
	 * ```
	 */
	stopAll(): void {
		for (const job of this.store.values()) {
			this.scheduler.clearTimeout(job);
		}
		this.store.clear();
	}
}

/**
 * Singleton instance of CronJobManager.
 * 
 * This pre-created instance can be imported and used directly
 * for simple use cases where a single manager is sufficient.
 * 
 * @type {CronJobManager}
 * @example
 * ```typescript
 * import { cronManager } from "./manager";
 * 
 * await cronManager.schedule("task", "* /5 * * * *", async () => {
 *   console.log("Running every 5 minutes");
 * });
 * ```
 */
export const cronManager = new CronJobManager();
