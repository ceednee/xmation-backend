/**
 * Action: WAIT_DELAY
 * 
 * Pauses workflow execution for a specified duration.
 * Useful for rate limiting, spacing out actions, or waiting for external processes.
 * 
 * ## Configuration
 * - `delayMs` (optional) - Delay in milliseconds. Defaults to 5000ms (5 seconds)
 * - `delay` (optional) - Human-readable delay format (e.g., "5s", "2m", "1h")
 *   - `s` - seconds
 *   - `m` - minutes
 *   - `h` - hours
 * 
 * ## Delay Format Examples
 * - `"5s"` - 5 seconds
 * - `"30s"` - 30 seconds
 * - `"2m"` - 2 minutes
 * - `"1h"` - 1 hour
 * 
 * ## Note
 * - In dry-run mode, the delay is skipped but logged
 * - Maximum actual delay is capped at 5 seconds for safety
 * 
 * ## Example
 * ```typescript
 * const config = { delay: "30s" };
 * const result = await waitDelayExecutor(config, context);
 * 
 * // Or using milliseconds
 * const config2 = { delayMs: 30000 };
 * const result2 = await waitDelayExecutor(config2, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult } from "./base";

/**
 * Parse human-readable delay format to milliseconds
 * 
 * @param delay - Delay string (e.g., "5s", "2m", "1h")
 * @returns Milliseconds or 0 if invalid format
 */
const parseDelay = (delay: string): number => {
	const match = delay.match(/^(\d+)([smh])$/);
	if (!match) return 0;
	
	const value = Number.parseInt(match[1] ?? "0");
	const unit = match[2];
	
	const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000 };
	return value * (multipliers[unit] || 0);
};

/**
 * Executes WAIT_DELAY action
 * Waits for the specified duration before continuing
 * 
 * @param config - Action configuration with delay settings
 * @param context - Action execution context
 * @returns Action result with wait details
 */
export const waitDelayExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		let delayMs = Number(config.delayMs) || 0;
		
		if (typeof config.delay === "string") {
			delayMs = parseDelay(config.delay) || delayMs;
		}

		if (!context.dryRun && delayMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000)));
		}

		return createResult(true, "WAIT_DELAY", Date.now() - start, { delayMs, waited: !context.dryRun });
	} catch (error) {
		return createResult(false, "WAIT_DELAY", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to wait");
	}
};
