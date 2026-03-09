import type { JobMetrics } from "./types";
import { validateCronExpression } from "./validation";
import { JobStore } from "./job-store";
import { JobScheduler } from "./job-scheduler";
import { createJob } from "./factory";
import { executeJob } from "./executor";

export class CronJobManager {
	private store: JobStore = new JobStore();
	private scheduler: JobScheduler = new JobScheduler();

	async schedule(name: string, interval: string, handler: () => Promise<void>): Promise<void> {
		if (!validateCronExpression(interval)) {
			throw new Error(`Invalid cron expression: ${interval}`);
		}
		const job = createJob(name, interval, handler);
		this.store.set(name, job);
		this.scheduler.scheduleNext(job, (n) => this.executeJob(n));
	}

	async unschedule(name: string): Promise<void> {
		const job = this.store.get(name);
		if (job) this.scheduler.clearTimeout(job);
		this.store.delete(name);
	}

	async executeJob(name: string): Promise<void> {
		const job = this.store.get(name);
		if (!job) throw new Error(`Job not found: ${name}`);
		
		await executeJob(job, () => this.scheduler.scheduleNext(job, (n) => this.executeJob(n)));
	}

	getScheduledJobs(): Array<{ name: string; interval: string }> {
		return Array.from(this.store.values()).map(job => ({
			name: job.name,
			interval: job.interval,
		}));
	}

	getJobMetrics(name: string): JobMetrics | undefined {
		return this.store.get(name)?.metrics;
	}

	validateCronExpression(expression: string): boolean {
		return validateCronExpression(expression);
	}

	stopAll(): void {
		for (const job of this.store.values()) {
			this.scheduler.clearTimeout(job);
		}
		this.store.clear();
	}
}

export const cronManager = new CronJobManager();
