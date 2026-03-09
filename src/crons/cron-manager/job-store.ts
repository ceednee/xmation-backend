/**
 * @module cron-manager/job-store
 * 
 * In-memory storage for scheduled jobs.
 * 
 * This module provides the {@link JobStore} class, which manages the persistence
 * and retrieval of scheduled job definitions. It uses a Map internally for
 * efficient O(1) lookups by job name and provides methods for CRUD operations
 * on the job collection.
 * 
 * The job store is the single source of truth for all registered jobs
 * and their current state within the cron manager.
 * 
 * @example
 * ```typescript
 * import { JobStore } from "./job-store";
 * import { createJob } from "./factory";
 * 
 * const store = new JobStore();
 * 
 * // Store a job
 * const job = createJob("test-job", "* /5 * * * *", async () => { console.log("run"); }); // every 5 min
 * store.set("test-job", job);
 * 
 * // Retrieve the job
 * const retrieved = store.get("test-job");
 * 
 * // Iterate all jobs
 * for (const job of store.values()) {
 *   console.log(`Registered: ${job.name}`);
 * }
 * ```
 */

import type { ScheduledJob } from "./types";

/**
 * In-memory storage container for scheduled jobs.
 * 
 * Manages a collection of {@link ScheduledJob} instances using a Map
 * for efficient keyed access. Provides methods for adding, retrieving,
 * removing, and iterating over jobs.
 * 
 * @class JobStore
 */
export class JobStore {
	/**
	 * Internal Map storing jobs keyed by their name.
	 * @private
	 * @type {Map<string, ScheduledJob>}
	 */
	private jobs: Map<string, ScheduledJob> = new Map();

	/**
	 * Stores a job in the store.
	 * 
	 * If a job with the same name already exists, it will be overwritten.
	 * 
	 * @param {string} name - The unique name identifier for the job
	 * @param {ScheduledJob} job - The scheduled job to store
	 * @returns {void}
	 * @example
	 * ```typescript
	 * store.set("cleanup", createJob("cleanup", "0 2 * * *", handler));
	 * ```
	 */
	set(name: string, job: ScheduledJob): void {
		this.jobs.set(name, job);
	}

	/**
	 * Retrieves a job by name.
	 * 
	 * @param {string} name - The name of the job to retrieve
	 * @returns {ScheduledJob | undefined} The job if found, undefined otherwise
	 * @example
	 * ```typescript
	 * const job = store.get("cleanup");
	 * if (job) {
	 *   console.log(`Job interval: ${job.interval}`);
	 * }
	 * ```
	 */
	get(name: string): ScheduledJob | undefined {
		return this.jobs.get(name);
	}

	/**
	 * Removes a job from the store.
	 * 
	 * If the job doesn't exist, this operation is a no-op.
	 * 
	 * @param {string} name - The name of the job to remove
	 * @returns {void}
	 * @example
	 * ```typescript
	 * store.delete("old-job");
	 * ```
	 */
	delete(name: string): void {
		this.jobs.delete(name);
	}

	/**
	 * Removes all jobs from the store.
	 * 
	 * Clears the entire job collection. This is typically called when
	 * shutting down the cron manager.
	 * 
	 * @returns {void}
	 * @example
	 * ```typescript
	 * // Cleanup all jobs
	 * store.clear();
	 * ```
	 */
	clear(): void {
		this.jobs.clear();
	}

	/**
	 * Returns an iterator over all stored jobs.
	 * 
	 * Useful for iterating over all registered jobs to perform
	 * operations like stopping all timers or generating reports.
	 * 
	 * @returns {IterableIterator<ScheduledJob>} Iterator yielding each scheduled job
	 * @example
	 * ```typescript
	 * for (const job of store.values()) {
	 *   console.log(`${job.name}: ${job.interval}`);
	 * }
	 * ```
	 */
	values(): IterableIterator<ScheduledJob> {
		return this.jobs.values();
	}
}
