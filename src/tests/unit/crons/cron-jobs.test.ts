import { describe, expect, it, beforeEach } from "bun:test";
import { CronJobManager } from "../../../crons/cron-manager";

/**
 * Cron Job Tests
 * 
 * Tests for scheduled background jobs that sync X data
 * and process workflows.
 */

describe("Cron Jobs", () => {
	let cronManager: CronJobManager;

	beforeEach(() => {
		cronManager = new CronJobManager();
	});

	describe("Job Scheduling", () => {
		it("should schedule jobs with correct intervals", async () => {
			const jobs = [
				{ name: "mentions_sync", interval: "*/10 * * * *" },      // Every 10 min
				{ name: "followers_sync", interval: "*/15 * * * *" },     // Every 15 min
				{ name: "posts_sync", interval: "*/30 * * * *" },         // Every 30 min
				{ name: "workflow_processor", interval: "*/5 * * * *" },  // Every 5 min
			];

			for (const job of jobs) {
				await cronManager.schedule(job.name, job.interval, async () => {
					// Job handler
				});
			}

			const scheduledJobs = cronManager.getScheduledJobs();
			expect(scheduledJobs).toHaveLength(4);
			expect(scheduledJobs.map(j => j.name)).toContain("mentions_sync");
			expect(scheduledJobs.map(j => j.name)).toContain("followers_sync");
			expect(scheduledJobs.map(j => j.name)).toContain("posts_sync");
			expect(scheduledJobs.map(j => j.name)).toContain("workflow_processor");
		});

		it("should validate cron expressions", async () => {
			const validIntervals = [
				"*/5 * * * *",      // Every 5 minutes
				"0 * * * *",        // Every hour
				"0 0 * * *",        // Daily at midnight
				"*/10 * * * *",     // Every 10 minutes
			];

			for (const interval of validIntervals) {
				const isValid = cronManager.validateCronExpression(interval);
				expect(isValid).toBe(true);
			}
		});

		it("should reject invalid cron expressions", async () => {
			const invalidIntervals = [
				"invalid",
				"* * *",            // Missing parts
				"61 * * * *",       // Invalid minute
				"",
			];

			for (const interval of invalidIntervals) {
				const isValid = cronManager.validateCronExpression(interval);
				expect(isValid).toBe(false);
			}
		});
	});

	describe("Job Execution", () => {
		it("should execute job handler when triggered", async () => {
			let executed = false;

			await cronManager.schedule("test_job", "*/5 * * * *", async () => {
				executed = true;
			});

			// Simulate job execution
			await cronManager.executeJob("test_job");

			expect(executed).toBe(true);
		});

		it("should handle job execution errors gracefully", async () => {
			let errorLogged = false;

			await cronManager.schedule("failing_job", "*/5 * * * *", async () => {
				throw new Error("Job failed");
			});

			// Should not throw, should log error
			try {
				await cronManager.executeJob("failing_job");
			} catch {
				errorLogged = true;
			}

			// Error should be caught and logged, not thrown
			expect(errorLogged).toBe(false);
		});

		it("should track job execution metrics", async () => {
			await cronManager.schedule("metrics_job", "*/5 * * * *", async () => {
				// Simulate work
				await new Promise(resolve => setTimeout(resolve, 10));
			});

			await cronManager.executeJob("metrics_job");

			const metrics = cronManager.getJobMetrics("metrics_job");
			expect(metrics).toBeDefined();
			expect(metrics?.executionCount).toBeGreaterThan(0);
			expect(metrics?.lastExecutionTime).toBeGreaterThan(0);
		});
	});

	describe("Job Management", () => {
		it("should unschedule jobs", async () => {
			await cronManager.schedule("temp_job", "*/5 * * * *", async () => {});

			expect(cronManager.getScheduledJobs()).toHaveLength(1);

			await cronManager.unschedule("temp_job");

			expect(cronManager.getScheduledJobs()).toHaveLength(0);
		});

		it("should list all scheduled jobs", async () => {
			await cronManager.schedule("job1", "*/5 * * * *", async () => {});
			await cronManager.schedule("job2", "*/10 * * * *", async () => {});

			const jobs = cronManager.getScheduledJobs();
			expect(jobs).toHaveLength(2);
		});
	});

	describe("Concurrent Execution Prevention", () => {
		it("should prevent concurrent execution of the same job", async () => {
			let executionCount = 0;

			await cronManager.schedule("slow_job", "*/5 * * * *", async () => {
				executionCount++;
				// Simulate slow operation
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			// Try to execute same job multiple times concurrently
			await Promise.all([
				cronManager.executeJob("slow_job"),
				cronManager.executeJob("slow_job"),
				cronManager.executeJob("slow_job"),
			]);

			// Should only execute once despite multiple calls
			expect(executionCount).toBe(1);
		});
	});
});
