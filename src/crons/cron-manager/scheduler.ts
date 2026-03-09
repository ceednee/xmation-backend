/**
 * @module cron-manager/scheduler
 * 
 * Cron expression parsing and next run time calculation.
 * 
 * This module provides utilities for calculating when a job should next
 * execute based on its cron expression. It supports basic cron syntax
 * including wildcards, step values (star/n), and specific values.
 * 
 * Currently supports simplified parsing focused on minute and hour fields.
 * More complex expressions (day of month, month, day of week) are partially
 * supported but may have limited functionality.
 * 
 * @example
 * ```typescript
 * import { getNextRunTime } from "./scheduler";
 * 
 * // Get next run time for a job that runs every 5 minutes
 * const nextRun = getNextRunTime("* /5 * * * *");
 * console.log(new Date(nextRun));
 * 
 * // Get next run time starting from a specific time
 * const fromTime = Date.now() + 3600000; // 1 hour from now
 * const nextRun = getNextRunTime("0 9 * * *", fromTime);
 * ```
 */

/**
 * Calculates the next execution timestamp based on a cron expression.
 * 
 * Parses the cron expression and computes the next time the job should run
 * relative to the provided start time (or current time if not specified).
 * 
 * Supported patterns:
 * - `*` - Every unit (minute/hour)
 * - `* /n` - Every nth unit (e.g., star/5 = every 5 minutes)
 * - `n` - Specific value
 * 
 * Note: Day of month, month, and day of week fields are parsed but have
 * limited scheduling impact in the current implementation.
 * 
 * @export
 * @param {string} expression - The cron expression (5 fields: min hour dom mon dow)
 * @param {number} [fromTime=Date.now()] - Timestamp to calculate next run from
 * @returns {number} Timestamp (in milliseconds) of the next scheduled execution
 * @example
 * ```typescript
 * // Every minute
 * getNextRunTime("* * * * *"); // Returns timestamp ~1 minute from now
 * 
 * // Every 15 minutes
 * getNextRunTime("* /15 * * * *"); // Next quarter hour
 * 
 * // Every day at 9:30 AM
 * getNextRunTime("30 9 * * *"); // Next 9:30 AM occurrence
 * ```
 */
export const getNextRunTime = (expression: string, fromTime: number = Date.now()): number => {
	const parts = expression.trim().split(/\s+/);
	const [minute, hour] = parts;

	const now = new Date(fromTime);
	const next = new Date(fromTime);

	if (minute.startsWith("*/")) {
		const interval = parseInt(minute.replace("*/", ""));
		const currentMinute = now.getMinutes();
		const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;

		if (nextMinute < 60) {
			next.setMinutes(nextMinute, 0, 0);
		} else {
			next.setHours(next.getHours() + 1, 0, 0, 0);
		}
	} else if (minute === "*") {
		next.setMinutes(next.getMinutes() + 1, 0, 0);
	} else {
		next.setMinutes(parseInt(minute), 0, 0);
		if (next <= now) {
			next.setHours(next.getHours() + 1);
		}
	}

	if (hour !== "*" && !hour.startsWith("*/")) {
		next.setHours(parseInt(hour));
	}

	return next.getTime();
};
