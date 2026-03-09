/**
 * Action Executor (Advanced)
 * 
 * Advanced action executor with delay and error handling support.
 * Provides higher-level execution methods for complex scenarios.
 * 
 * @module workflow-runner/action-executor
 */

import type { ActionConfig } from "../../types";
import type { ExecutionContext, ExecutionState } from "./types";
import { SingleActionExecutor, handleExecutionSuccess, handleExecutionFailure, handleExecutionError } from "./executor";
import { sleep } from "./delay";

/**
 * Advanced action executor with enhanced capabilities.
 * 
 * The ActionExecutor provides methods for executing actions with
 * built-in delay handling and error management. It wraps the
 * SingleActionExecutor with additional functionality.
 * 
 * @example
 * ```typescript
 * const executor = new ActionExecutor();
 * 
 * // Execute with delay
 * await executor.executeWithDelay(action, context, state);
 * 
 * // Execute with automatic error handling
 * await executor.executeWithErrorHandling(action, context, state);
 * ```
 */
export class ActionExecutor {
	private singleExecutor: SingleActionExecutor;

	/**
	 * Creates a new ActionExecutor with its own SingleActionExecutor.
	 */
	constructor() {
		this.singleExecutor = new SingleActionExecutor();
	}

	/**
	 * Execute an action with delay support.
	 * 
	 * If the action has a delay configured, waits for the specified
	 * duration before executing. Logs the delay and execution.
	 * 
	 * @param action - The action configuration to execute
	 * @param context - The execution context
	 * @param state - The mutable execution state to update
	 * @returns Promise that resolves when execution completes
	 */
	async executeWithDelay(action: ActionConfig, context: ExecutionContext, state: ExecutionState): Promise<void> {
		state.logs.push(`Executing action: ${action.type} (${action.id})`);

		if (action.delay && action.delay > 0) {
			state.logs.push(`Waiting ${action.delay}ms before executing`);
			await sleep(action.delay);
		}

		const result = await this.singleExecutor.execute(action, context);

		if (result.success) {
			handleExecutionSuccess(action.type, state);
		} else {
			handleExecutionFailure(action.type, result.error, state);
		}
	}

	/**
	 * Execute an action with automatic error handling.
	 * 
	 * Wraps executeWithDelay in a try-catch block to ensure errors
	 * are properly logged to the execution state.
	 * 
	 * @param action - The action configuration to execute
	 * @param context - The execution context
	 * @param state - The mutable execution state to update
	 * @returns Promise that resolves when execution completes (even on error)
	 */
	async executeWithErrorHandling(action: ActionConfig, context: ExecutionContext, state: ExecutionState): Promise<void> {
		try {
			await this.executeWithDelay(action, context, state);
		} catch (error) {
			handleExecutionError(action.type, error, state);
		}
	}
}
