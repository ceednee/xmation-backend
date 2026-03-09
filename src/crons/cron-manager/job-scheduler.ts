import type { ScheduledJob } from "./types";
import { getNextRunTime } from "./scheduler";

export class JobScheduler {
	scheduleNext(job: ScheduledJob, executeFn: (name: string) => Promise<void>): void {
		if (job.timeoutId) clearTimeout(job.timeoutId);
		const delay = getNextRunTime(job.interval) - Date.now();
		job.timeoutId = setTimeout(() => executeFn(job.name), Math.max(0, delay));
	}

	clearTimeout(job: ScheduledJob): void {
		if (job.timeoutId) clearTimeout(job.timeoutId);
	}
}
