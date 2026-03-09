/**
 * @module cron-manager/types
 * 
 * Type definitions and interfaces for the cron job management system.
 * 
 * This module defines the core data structures used throughout the cron manager,
 * including job metrics tracking, scheduled job definitions, and configuration options.
 * 
 * @example
 * ```typescript
 * import type { ScheduledJob, JobMetrics, CronManagerOptions } from "./types";
 * 
 * const job: ScheduledJob = {
 *   name: "daily-cleanup",
 *   interval: "0 2 * * *",
 *   handler: async () => { console.log("Cleanup complete"); },
 *   isRunning: false,
 *   metrics: { executionCount: 0, lastExecutionTime: 0, totalErrors: 0 }
 * };
 * ```
 */

/**
 * Metrics tracking interface for scheduled job performance monitoring.
 * 
 * Tracks execution statistics including success/failure rates,
 * timing information, and error counts to help monitor job health.
 * 
 * @interface JobMetrics
 */
export interface JobMetrics {
	/**
	 * Total number of times the job has been executed.
	 * @type {number}
	 */
	executionCount: number;

	/**
	 * Timestamp (in milliseconds) of the last job execution completion.
	 * @type {number}
	 */
	lastExecutionTime: number;

	/**
	 * Optional timestamp (in milliseconds) of the last successful execution.
	 * @type {number | undefined}
	 */
	lastSuccessTime?: number;

	/**
	 * Optional timestamp (in milliseconds) of the last failed execution.
	 * @type {number | undefined}
	 */
	lastErrorTime?: number;

	/**
	 * Total number of errors encountered during job executions.
	 * @type {number}
	 */
	totalErrors: number;
}

/**
 * Interface representing a scheduled cron job.
 * 
 * Contains all metadata and state for a recurring job including
 * its execution schedule, handler function, and runtime metrics.
 * 
 * @interface ScheduledJob
 */
export interface ScheduledJob {
	/**
	 * Unique identifier name for the job.
	 * @type {string}
	 */
	name: string;

	/**
	 * Cron expression defining the execution schedule.
	 * Format: "minute hour day-of-month month day-of-week"
	 * @type {string}
	 * @example "0 9 * * 1-5" - Every weekday at 9:00 AM
	 */
	interval: string;

	/**
	 * Async handler function to execute when the job runs.
	 * @type {() => Promise<void>}
	 */
	handler: () => Promise<void>;

	/**
	 * Flag indicating whether the job is currently executing.
	 * @type {boolean}
	 */
	isRunning: boolean;

	/**
	 * Performance metrics for this job.
	 * @type {JobMetrics}
	 */
	metrics: JobMetrics;

	/**
	 * Timeout ID for the scheduled next execution.
	 * Used internally for cancellation.
	 * @type {ReturnType<typeof setTimeout> | undefined}
	 */
	timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * @deprecated Use {@link ScheduledJob} instead. This type alias is kept for backward compatibility.
 * @type {ScheduledJob}
 */
export type CronJob = ScheduledJob;

/**
 * Configuration interface for cron schedule expressions.
 * 
 * Allows specifying both the cron expression and an optional timezone.
 * 
 * @interface CronSchedule
 */
export interface CronSchedule {
	/**
	 * The cron expression string.
	 * @type {string}
	 * @example "0 * /6 * * *" - Every 6 hours (space prevents comment close)
	 */
	expression: string;

	/**
	 * Optional IANA timezone identifier.
	 * @type {string | undefined}
	 * @example "America/New_York"
	 */
	timezone?: string;
}

/**
 * Configuration options for the CronJobManager.
 * 
 * @interface CronManagerOptions
 */
export interface CronManagerOptions {
	/**
	 * Whether the cron manager is enabled and should process jobs.
	 * @type {boolean | undefined}
	 * @default true
	 */
	enabled?: boolean;

	/**
	 * Default timezone to use for all scheduled jobs.
	 * @type {string | undefined}
	 * @example "UTC"
	 */
	defaultTimezone?: string;
}
