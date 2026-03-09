import type { ScheduledJob } from "./types";

export class JobStore {
	private jobs: Map<string, ScheduledJob> = new Map();

	set(name: string, job: ScheduledJob): void {
		this.jobs.set(name, job);
	}

	get(name: string): ScheduledJob | undefined {
		return this.jobs.get(name);
	}

	delete(name: string): void {
		this.jobs.delete(name);
	}

	clear(): void {
		this.jobs.clear();
	}

	values(): IterableIterator<ScheduledJob> {
		return this.jobs.values();
	}
}
