/**
 * @module crons/cron-manager
 * 
 * Main entry point for the cron manager module.
 * 
 * This module serves as a convenience re-export from the cron-manager directory,
 * providing a single import point for all cron management functionality.
 * It maintains backward compatibility with existing code that imports from
 * this path.
 * 
 * All functionality is delegated to and re-exported from the
 * {@link cron-manager/index} module.
 * 
 * @example
 * ```typescript
 * // Import everything from the cron manager
 * import { 
 *   CronJobManager, 
 *   cronManager, 
 *   createJob, 
 *   validateCronExpression,
 *   type CronJob,
 *   type CronSchedule,
 *   type CronManagerOptions 
 * } from "./crons/cron-manager";
 * 
 * // Use the singleton manager
 * await cronManager.schedule("cleanup", "0 2 * * *", async () => {
 *   await runCleanupTasks();
 * });
 * ```
 */

// Re-export from cron-manager module for backward compatibility
export * from "./cron-manager/index";
