/**
 * Cron Job Manager
 * 
 * Manages scheduled background jobs for data sync and workflow processing.
 */

interface JobMetrics {
	executionCount: number;
	lastExecutionTime: number;
	lastSuccessTime?: number;
	lastErrorTime?: number;
	totalErrors: number;
}

interface ScheduledJob {
	name: string;
	interval: string;
	handler: () => Promise<void>;
	isRunning: boolean;
	metrics: JobMetrics;
	timeoutId?: ReturnType<typeof setTimeout>;
}

/**
 * Simple cron expression validator
 * Supports: asterisk (any), asterisk-slash-n (step), n (specific), n-m (range)
 */
const validateCronExpression = (expression: string): boolean => {
	if (!expression || typeof expression !== "string") {
		return false;
	}

	const parts = expression.trim().split(/\s+/);
	if (parts.length !== 5) {
		return false;
	}

	const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

	// Basic validation patterns
	const patterns = [
		/^\*(\/\d+)?$/,           // * or */n
		/^\d+$/,                   // n
		/^\d+-\d+$/,               // n-m
		/^\d+(,\d+)*$/,            // n,m,o
	];

	const isValid = (part: string): boolean => {
		return patterns.some(pattern => pattern.test(part));
	};

	// Validate minute (0-59)
	if (!isValid(minute)) return false;
	if (/^\d+$/.test(minute) && (parseInt(minute) < 0 || parseInt(minute) > 59)) {
		return false;
	}

	// Validate hour (0-23)
	if (!isValid(hour)) return false;
	if (/^\d+$/.test(hour) && (parseInt(hour) < 0 || parseInt(hour) > 23)) {
		return false;
	}

	// Validate day of month (1-31)
	if (!isValid(dayOfMonth)) return false;
	if (/^\d+$/.test(dayOfMonth) && (parseInt(dayOfMonth) < 1 || parseInt(dayOfMonth) > 31)) {
		return false;
	}

	// Validate month (1-12)
	if (!isValid(month)) return false;
	if (/^\d+$/.test(month) && (parseInt(month) < 1 || parseInt(month) > 12)) {
		return false;
	}

	// Validate day of week (0-6)
	if (!isValid(dayOfWeek)) return false;
	if (/^\d+$/.test(dayOfWeek) && (parseInt(dayOfWeek) < 0 || parseInt(dayOfWeek) > 6)) {
		return false;
	}

	return true;
};

/**
 * Calculate next run time for a cron expression
 * Simplified implementation for common patterns
 */
const getNextRunTime = (expression: string, fromTime: number = Date.now()): number => {
	const parts = expression.trim().split(/\s+/);
	const [minute, hour] = parts;

	const now = new Date(fromTime);
	const next = new Date(fromTime);

	// Handle */n pattern for minutes
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

	// Handle hour
	if (hour !== "*" && !hour.startsWith("*/")) {
		next.setHours(parseInt(hour));
	}

	return next.getTime();
};

/**
 * Cron Job Manager
 */
export class CronJobManager {
	private jobs: Map<string, ScheduledJob> = new Map();

	/**
	 * Schedule a new job
	 */
	async schedule(
		name: string,
		interval: string,
		handler: () => Promise<void>
	): Promise<void> {
		if (!validateCronExpression(interval)) {
			throw new Error(`Invalid cron expression: ${interval}`);
		}

		const job: ScheduledJob = {
			name,
			interval,
			handler,
			isRunning: false,
			metrics: {
				executionCount: 0,
				lastExecutionTime: 0,
				totalErrors: 0,
			},
		};

		this.jobs.set(name, job);

		// Schedule first execution
		this.scheduleNextRun(job);
	}

	/**
	 * Unschedule a job
	 */
	async unschedule(name: string): Promise<void> {
		const job = this.jobs.get(name);
		if (job && job.timeoutId) {
			clearTimeout(job.timeoutId);
		}
		this.jobs.delete(name);
	}

	/**
	 * Execute a job immediately
	 */
	async executeJob(name: string): Promise<void> {
		const job = this.jobs.get(name);
		if (!job) {
			throw new Error(`Job not found: ${name}`);
		}

		// Prevent concurrent execution
		if (job.isRunning) {
			console.log(`Job ${name} is already running, skipping`);
			return;
		}

		job.isRunning = true;
		const startTime = Date.now();

		try {
			await job.handler();
			job.metrics.lastSuccessTime = Date.now();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Job ${name} failed:`, errorMessage);
			job.metrics.lastErrorTime = Date.now();
			job.metrics.totalErrors++;
		} finally {
			job.metrics.executionCount++;
			job.metrics.lastExecutionTime = Date.now() - startTime;
			job.isRunning = false;

			// Reschedule next run
			this.scheduleNextRun(job);
		}
	}

	/**
	 * Schedule next run for a job
	 */
	private scheduleNextRun(job: ScheduledJob): void {
		if (job.timeoutId) {
			clearTimeout(job.timeoutId);
		}

		const nextRunTime = getNextRunTime(job.interval);
		const delay = nextRunTime - Date.now();

		job.timeoutId = setTimeout(() => {
			this.executeJob(job.name);
		}, Math.max(0, delay));
	}

	/**
	 * Get all scheduled jobs
	 */
	getScheduledJobs(): Array<{ name: string; interval: string }> {
		return Array.from(this.jobs.values()).map(job => ({
			name: job.name,
			interval: job.interval,
		}));
	}

	/**
	 * Get metrics for a job
	 */
	getJobMetrics(name: string): JobMetrics | undefined {
		const job = this.jobs.get(name);
		return job?.metrics;
	}

	/**
	 * Validate cron expression
	 */
	validateCronExpression(expression: string): boolean {
		return validateCronExpression(expression);
	}

	/**
	 * Stop all jobs
	 */
	stopAll(): void {
		for (const job of this.jobs.values()) {
			if (job.timeoutId) {
				clearTimeout(job.timeoutId);
			}
		}
		this.jobs.clear();
	}
}

// Export singleton instance
export const cronManager = new CronJobManager();
