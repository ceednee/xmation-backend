/**
 * @module cron-manager/factory
 * 
 * Factory functions for creating scheduled job instances.
 * 
 * This module provides utility functions to create properly initialized
 * {@link ScheduledJob} objects with default metric values and proper typing.
 * Using the factory ensures consistent job initialization and reduces
 * boilerplate code when defining new cron jobs.
 * 
 * @example
 * ```typescript
 * import { createJob } from "./factory";
 * 
 * // Create a job with minimal configuration
 * const cleanupJob = createJob(
 *   "daily-cleanup",
 *   "0 2 * * *",
 *   async () => {
 *     await cleanupOldFiles();
 *     await optimizeDatabase();
 *   }
 * );
 * 
 * // The job is ready to be scheduled
 * manager.schedule(cleanupJob.name, cleanupJob.interval, cleanupJob.handler);
 * ```
 */

import type { ScheduledJob } from "./types";

/**
 * Creates a new scheduled job with initialized default values.
 * 
 * Factory function that creates a {@link ScheduledJob} object with:
 * - Properly typed name and interval
 * - The provided async handler function
 * - isRunning flag initialized to false
 * - Zeroed-out metrics object ready for tracking
 * 
 * @export
 * @param {string} name - Unique identifier for the job
 * @param {string} interval - Cron expression defining the schedule
 * @param {() => Promise<void>} handler - Async function to execute on schedule
 * @returns {ScheduledJob} A fully initialized scheduled job object
 * @example
 * ```typescript
 * const reportJob = createJob(
 *   "hourly-report",
 *   "0 * * * *",
 *   async () => {
 *     const data = await fetchMetrics();
 *     await sendReport(data);
 *   }
 * );
 * 
 * // reportJob structure:
 * // {
 * //   name: "hourly-report",
 * //   interval: "0 * * * *",
 * //   handler: [Function],
 * //   isRunning: false,
 * //   metrics: {
 * //     executionCount: 0,
 * //     lastExecutionTime: 0,
 * //     totalErrors: 0
 * //   }
 * // }
 * ```
 */
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
