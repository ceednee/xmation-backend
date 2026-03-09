/**
 * Action Execution Result Utilities
 * 
 * Helper functions for creating standardized action execution results.
 * Provides factory functions for success and error results.
 * 
 * @module action-dispatcher/result
 */

import type { ActionExecutionResult } from "./types";

/**
 * Create a success result for an action execution.
 * 
 * @param actionType - The type of action that was executed
 * @param actionId - Unique identifier for this action configuration
 * @param output - Output data from the action execution
 * @param executionTime - Time taken to execute in milliseconds
 * @param dryRun - Whether this was a simulated execution (default: false)
 * @returns A successful action execution result
 */
export const createSuccessResult = (
	actionType: string,
	actionId: string,
	output: Record<string, unknown>,
	executionTime: number,
	dryRun = false
): ActionExecutionResult => ({
	success: true,
	actionType,
	actionId,
	output,
	dryRun,
	executionTime,
	completedAt: Date.now(),
});

/**
 * Create an error result for a failed action execution.
 * 
 * @param actionType - The type of action that failed
 * @param actionId - Unique identifier for this action configuration
 * @param error - Error message describing what went wrong
 * @param executionTime - Time taken before failure in milliseconds
 * @param retryAfter - Optional seconds to wait before retry (for rate limits)
 * @returns A failed action execution result
 */
export const createErrorResult = (
	actionType: string,
	actionId: string,
	error: string,
	executionTime: number,
	retryAfter?: number
): ActionExecutionResult => ({
	success: false,
	actionType,
	actionId,
	error,
	retryAfter,
	executionTime,
	completedAt: Date.now(),
});
