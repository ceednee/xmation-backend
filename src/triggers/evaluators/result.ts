/**
 * Trigger Result Utilities
 * 
 * Provides helper functions and type re-exports for trigger evaluators.
 * The createResult function standardizes trigger result creation with timestamps.
 * 
 * ## Usage
 * 
 * ```typescript
 * import { createResult } from "./result";
 * 
 * // Successful trigger
 * return createResult(true, "NEW_MENTION", { mentions: [...] });
 * 
 * // No trigger
 * return createResult(false, "NEW_MENTION");
 * ```
 */

import type { TriggerResult, TriggerEvaluator } from "../types";

/**
 * Re-export of TriggerResult type for convenience
 */
export type { TriggerResult };

/**
 * Re-export of TriggerEvaluator type for convenience
 */
export type { TriggerEvaluator };

/**
 * Creates a standardized trigger result object
 * 
 * @param triggered - Whether the trigger condition was met
 * @param triggerType - The type identifier for this trigger (e.g., "NEW_MENTION")
 * @param data - Optional data payload with additional trigger information
 * @returns Complete TriggerResult object with timestamp
 */
export const createResult = (
	triggered: boolean,
	triggerType: string,
	data?: Record<string, unknown>,
): TriggerResult => ({
	triggered,
	triggerType,
	data,
	timestamp: Date.now(),
});
