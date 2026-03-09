/**
 * Cron Manager Module
 * 
 * Manages scheduled workflow execution using cron expressions.
 * Handles job scheduling, validation, and execution.
 * 
 * ## Key Concepts
 * 
 * - **Cron Expressions**: Standard cron syntax (e.g., "0 9 * * 1-5")
 * - **Job Store**: Persists scheduled jobs
 * - **Scheduler**: Calculates next run times
 * - **Executor**: Runs scheduled workflows
 * 
 * ## Cron Expression Format
 * 
 * ```
 *  ┌───────────── minute (0 - 59)
 *  │ ┌───────────── hour (0 - 23)
 *  │ │ ┌───────────── day of month (1 - 31)
 *  │ │ │ ┌───────────── month (1 - 12)
 *  │ │ │ │ ┌───────────── day of week (0 - 6)
 *  │ │ │ │ │
 *  │ │ │ │ │
 *  * * * * *
 * ```
 * 
 * ## Module Structure
 * 
 * - `manager.ts` - Main CronJobManager class
 * - `validation.ts` - Cron expression validation
 * - `scheduler.ts` - Schedule calculation
 * - `executor.ts` - Job execution
 * - `job-store.ts` - Job persistence
 * - `job-scheduler.ts` - Job scheduling logic
 * - `factory.ts` - Job factory (createJob)
 * 
 * ## Usage
 * 
 * ```typescript
 * const manager = new CronJobManager();
 * 
 * // Schedule workflow
 * await manager.schedule("daily-report", "0 9 * * 1-5", async () => {
 *   // Run workflow
 * });
 * 
 * // List scheduled jobs
 * const jobs = await manager.listJobs();
 * 
 * // Cancel scheduled job
 * await manager.unschedule("daily-report");
 * ```
 */

export { CronJobManager, cronManager } from "./manager";
export { createJob } from "./factory";
export { validateCronExpression } from "./validation";
export type { CronJob, CronSchedule, CronManagerOptions } from "./types";
