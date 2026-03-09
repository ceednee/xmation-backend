/**
 * Delay Utility
 * 
 * Provides a simple sleep function for introducing delays in execution.
 * Used between workflow actions and for testing purposes.
 * 
 * @module workflow-runner/delay
 */

/**
 * Pause execution for the specified number of milliseconds.
 * 
 * Returns a Promise that resolves after the given duration.
 * Can be used with await to introduce delays in async functions.
 * 
 * @param ms - The number of milliseconds to sleep
 * @returns A Promise that resolves after the delay
 * 
 * @example
 * ```typescript
 * console.log("Starting...");
 * await sleep(1000); // Wait 1 second
 * console.log("Done!");
 * ```
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
