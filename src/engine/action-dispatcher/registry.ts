/**
 * Action Handler Registry
 * 
 * Manages registration and lookup of action handlers.
 * Provides a central registry for mapping action types to their handlers.
 * 
 * @module action-dispatcher/registry
 */

import type { ActionHandler } from "./types";
import {
	handleReplyToTweet,
	handleSendDM,
	handleFollowUser,
	handleLogEvent,
	SIMPLE_ACTIONS,
	createSimpleHandler,
} from "./handlers";

/**
 * Registry for action handlers.
 * 
 * The HandlerRegistry maintains a mapping of action types to their handler functions.
 * It automatically registers default handlers for common action types on instantiation.
 * 
 * @example
 * ```typescript
 * const registry = new HandlerRegistry();
 * 
 * // Check if handler exists
 * if (registry.has("REPLY_TO_TWEET")) {
 *   const handler = registry.get("REPLY_TO_TWEET");
 * }
 * 
 * // Register custom handler
 * registry.set("CUSTOM_ACTION", customHandler);
 * ```
 */
export class HandlerRegistry {
	private handlers: Map<string, ActionHandler> = new Map();

	/**
	 * Creates a new HandlerRegistry with default handlers registered.
	 */
	constructor() {
		this.registerDefaults();
	}

	/**
	 * Get a handler for the specified action type.
	 * 
	 * @param actionType - The action type to look up
	 * @returns The handler function, or undefined if not found
	 */
	get(actionType: string): ActionHandler | undefined {
		return this.handlers.get(actionType);
	}

	/**
	 * Check if a handler is registered for the given action type.
	 * 
	 * @param actionType - The action type to check
	 * @returns True if a handler exists, false otherwise
	 */
	has(actionType: string): boolean {
		return this.handlers.has(actionType);
	}

	/**
	 * Register a handler for an action type.
	 * 
	 * @param actionType - The action type to register
	 * @param handler - The handler function for this action type
	 */
	set(actionType: string, handler: ActionHandler): void {
		this.handlers.set(actionType, handler);
	}

	/**
	 * Register default handlers for built-in action types.
	 * 
	 * This includes handlers for:
	 * - REPLY_TO_TWEET
	 * - SEND_DM
	 * - FOLLOW_USER
	 * - LOG_EVENT
	 * - All simple actions (FOLLOW_BACK, RETWEET, etc.)
	 */
	private registerDefaults(): void {
		this.handlers.set("REPLY_TO_TWEET", handleReplyToTweet);
		this.handlers.set("SEND_DM", handleSendDM);
		this.handlers.set("FOLLOW_USER", handleFollowUser);
		this.handlers.set("LOG_EVENT", handleLogEvent);

		for (const actionType of SIMPLE_ACTIONS) {
			this.handlers.set(actionType, createSimpleHandler(actionType));
		}
	}
}
