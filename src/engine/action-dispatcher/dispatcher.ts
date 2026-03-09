/**
 * Action Dispatcher Implementation
 * 
 * Core dispatcher that routes workflow actions to their registered handlers.
 * Handles template variable substitution, error handling, and execution timing.
 * 
 * @module action-dispatcher/dispatcher
 */

import type { ActionConfig } from "../../types";
import type { ActionExecutionResult, ActionContext } from "./types";
import { substituteTemplates } from "./template";
import { createErrorResult } from "./result";
import { HandlerRegistry } from "./registry";

/**
 * Dispatches workflow actions to their appropriate handlers.
 * 
 * The ActionDispatcher is responsible for:
 * - Looking up handlers from the registry
 * - Processing template variables in action configuration
 * - Executing actions and handling errors
 * - Tracking execution time
 * 
 * @example
 * ```typescript
 * const dispatcher = new ActionDispatcher();
 * const result = await dispatcher.execute(action, context);
 * ```
 */
export class ActionDispatcher {
	private registry: HandlerRegistry;

	/**
	 * Creates a new ActionDispatcher with default handlers registered.
	 */
	constructor() {
		this.registry = new HandlerRegistry();
	}

	/**
	 * Execute an action with the given configuration and context.
	 * 
	 * This method:
	 * 1. Looks up the handler for the action type
	 * 2. Processes template variables in the config
	 * 3. Executes the handler
	 * 4. Returns the result or an error result on failure
	 * 
	 * @param action - The action configuration to execute
	 * @param context - Execution context including user info and trigger data
	 * @returns Promise resolving to the execution result
	 */
	async execute(
		action: ActionConfig,
		context: ActionContext
	): Promise<ActionExecutionResult> {
		const startTime = Date.now();
		const handler = this.registry.get(action.type);

		if (!handler) {
			return createErrorResult(
				action.type,
				action.id,
				`Unknown action type: ${action.type}`,
				Date.now() - startTime
			);
		}

		try {
			const processedConfig = substituteTemplates(action.config, context.triggerData);
			return await handler(processedConfig, context);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : String(error);
			return createErrorResult(
				action.type,
				action.id,
				errorMessage,
				Date.now() - startTime
			);
		}
	}

	/**
	 * Check if a handler is registered for the given action type.
	 * 
	 * @param actionType - The action type to check
	 * @returns True if a handler exists, false otherwise
	 */
	hasHandler(actionType: string): boolean {
		return this.registry.has(actionType);
	}

	/**
	 * Register a custom handler for an action type.
	 * 
	 * @param actionType - The action type to register
	 * @param handler - The handler function for this action type
	 */
	registerHandler(actionType: string, handler: import("./types").ActionHandler): void {
		this.registry.set(actionType, handler);
	}
}

/**
 * Singleton instance of ActionDispatcher for global use.
 * 
 * Use this instance for standard action dispatching throughout the application.
 */
export const actionDispatcher = new ActionDispatcher();
