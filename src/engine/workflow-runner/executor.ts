/**
 * Action Execution Engine
 * 
 * Handles the sequential execution of workflow actions.
 * Manages delays, error handling, and execution state tracking.
 * 
 * @module workflow-runner/executor
 */

import type { ActionConfig } from "../../types";
import type { ExecutionContext, ExecutionState } from "./types";
import { ActionDispatcher } from "../action-dispatcher";
import { sleep } from "./delay";

/**
 * Executes single actions using the ActionDispatcher.
 * 
 * Provides a simplified interface for executing individual actions
 * within the workflow execution pipeline.
 * 
 * @example
 * ```typescript
 * const executor = new SingleActionExecutor();
 * const result = await executor.execute(action, context);
 * if (!result.success) {
 *   console.error(`Action failed: ${result.error}`);
 * }
 * ```
 */
export class SingleActionExecutor {
	private actionDispatcher: ActionDispatcher;

	/**
	 * Creates a new SingleActionExecutor with its own ActionDispatcher.
	 */
	constructor() {
		this.actionDispatcher = new ActionDispatcher();
	}

	/**
	 * Execute a single action.
	 * 
	 * @param action - The action configuration to execute
	 * @param context - The execution context
	 * @returns Promise resolving to success status and optional error
	 */
	async execute(action: ActionConfig, context: ExecutionContext): Promise<{ success: boolean; error?: string }> {
		const result = await this.actionDispatcher.execute(action, context);
		return { success: result.success, error: result.error };
	}
}

/**
 * Handle successful action execution.
 * 
 * Updates the execution state to reflect a completed action.
 * 
 * @param actionType - The type of action that succeeded
 * @param state - The mutable execution state to update
 */
export const handleExecutionSuccess = (actionType: string, state: ExecutionState): void => {
	state.actionsExecuted++;
	state.logs.push(`Action completed: ${actionType}`);
};

/**
 * Handle failed action execution.
 * 
 * Updates the execution state to reflect a failed action.
 * Records the first error encountered.
 * 
 * @param actionType - The type of action that failed
 * @param error - The error message (may be undefined)
 * @param state - The mutable execution state to update
 */
export const handleExecutionFailure = (actionType: string, error: string | undefined, state: ExecutionState): void => {
	state.actionsFailed++;
	state.hasErrors = true;
	state.logs.push(`Action failed: ${actionType} - ${error}`);
	if (!state.firstError) {
		state.firstError = error;
	}
};

/**
 * Handle action execution error.
 * 
 * Similar to handleExecutionFailure but accepts an unknown error type
 * and converts it to a string message.
 * 
 * @param actionType - The type of action that errored
 * @param error - The error (can be any type)
 * @param state - The mutable execution state to update
 */
export const handleExecutionError = (actionType: string, error: unknown, state: ExecutionState): void => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	state.actionsFailed++;
	state.hasErrors = true;
	state.logs.push(`Action error: ${actionType} - ${errorMessage}`);
	if (!state.firstError) {
		state.firstError = errorMessage;
	}
};

/**
 * Execute multiple actions sequentially.
 * 
 * Handles delays between actions and error aggregation.
 * Respects the continueOnError configuration for each action.
 * 
 * @param actions - Array of action configurations to execute
 * @param context - The execution context shared across all actions
 * @returns Promise resolving to the final execution state
 * 
 * @example
 * ```typescript
 * const state = await executeActions(workflow.actions, context);
 * console.log(`Executed: ${state.actionsExecuted}, Failed: ${state.actionsFailed}`);
 * ```
 */
export async function executeActions(
	actions: ActionConfig[],
	context: ExecutionContext,
): Promise<{
	actionsExecuted: number;
	actionsFailed: number;
	hasErrors: boolean;
	firstError?: string;
	logs: string[];
}> {
	const state: ExecutionState = {
		actionsExecuted: 0,
		actionsFailed: 0,
		hasErrors: false,
		logs: [],
	};

	const executor = new SingleActionExecutor();

	for (const action of actions) {
		// Handle delay
		if (action.delay && action.delay > 0) {
			await sleep(Math.min(action.delay, 5000));
		}

		try {
			const result = await executor.execute(action, context);
			if (result.success) {
				handleExecutionSuccess(action.type, state);
			} else {
				handleExecutionFailure(action.type, result.error, state);
				if (action.config.continueOnError !== true) {
					break;
				}
			}
		} catch (error) {
			handleExecutionError(action.type, error, state);
			if (action.config.continueOnError !== true) {
				break;
			}
		}
	}

	return state;
}
