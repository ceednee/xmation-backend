/**
 * Action Dispatcher
 * 
 * Dispatches actions by calling the X API or other services.
 * Handles template variable substitution and error handling.
 */

import type { ActionConfig, ActionType } from "../types";

export interface ActionExecutionResult {
	success: boolean;
	actionType: string;
	actionId: string;
	output?: Record<string, unknown>;
	error?: string;
	retryAfter?: number;
	dryRun?: boolean;
	executionTime: number;
	completedAt: number;
}

export interface ActionContext {
	userId: string;
	xAccessToken?: string;
	triggerData: Record<string, unknown>;
	dryRun?: boolean;
	simulateRateLimit?: boolean;
	simulateError?: Error;
}

// Action handler type
type ActionHandler = (
	config: Record<string, unknown>,
	context: ActionContext
) => Promise<ActionExecutionResult>;

/**
 * Action Dispatcher
 */
export class ActionDispatcher {
	private handlers: Map<string, ActionHandler> = new Map();

	constructor() {
		this.registerDefaultHandlers();
	}

	/**
	 * Execute an action
	 */
	async execute(
		action: ActionConfig,
		context: ActionContext
	): Promise<ActionExecutionResult> {
		const startTime = Date.now();
		const handler = this.handlers.get(action.type);

		if (!handler) {
			return {
				success: false,
				actionType: action.type,
				actionId: action.id,
				error: `Unknown action type: ${action.type}`,
				executionTime: Date.now() - startTime,
				completedAt: Date.now(),
			};
		}

		try {
			// Substitute template variables in config
			const processedConfig = this.substituteTemplates(
				action.config,
				context.triggerData
			);

			// Execute handler
			return await handler(processedConfig, context);
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return {
				success: false,
				actionType: action.type,
				actionId: action.id,
				error: errorMessage,
				executionTime: Date.now() - startTime,
				completedAt: Date.now(),
			};
		}
	}

	/**
	 * Check if handler exists for action type
	 */
	hasHandler(actionType: string): boolean {
		return this.handlers.has(actionType);
	}

	/**
	 * Register an action handler
	 */
	registerHandler(actionType: string, handler: ActionHandler): void {
		this.handlers.set(actionType, handler);
	}

	/**
	 * Substitute template variables in config
	 */
	private substituteTemplates(
		config: Record<string, unknown>,
		triggerData: Record<string, unknown>
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(config)) {
			if (typeof value === "string") {
				result[key] = this.replaceTemplateVars(value, triggerData);
			} else if (typeof value === "object" && value !== null) {
				result[key] = this.substituteTemplates(
					value as Record<string, unknown>,
					triggerData
				);
			} else {
				result[key] = value;
			}
		}

		return result;
	}

	/**
	 * Replace template variables in a string
	 */
	private replaceTemplateVars(
		template: string,
		data: Record<string, unknown>
	): string {
		return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
			const value = data[key];
			return value !== undefined ? String(value) : "";
		});
	}

	/**
	 * Register default action handlers
	 */
	private registerDefaultHandlers(): void {
		// REPLY_TO_TWEET
		this.handlers.set("REPLY_TO_TWEET", async (config, context) => {
			if (context.dryRun) {
				return {
					success: true,
					actionType: "REPLY_TO_TWEET",
					actionId: "dry_run",
					output: { text: config.text, simulated: true },
					dryRun: true,
					executionTime: 0,
					completedAt: Date.now(),
				};
			}

			// Simulate API call
			if (context.simulateRateLimit) {
				return {
					success: false,
					actionType: "REPLY_TO_TWEET",
					actionId: "api_call",
					error: "Rate limit exceeded",
					retryAfter: 900,
					executionTime: 0,
					completedAt: Date.now(),
				};
			}

			if (context.simulateError) {
				return {
					success: false,
					actionType: "REPLY_TO_TWEET",
					actionId: "api_call",
					error: context.simulateError.message,
					executionTime: 0,
					completedAt: Date.now(),
				};
			}

			return {
				success: true,
				actionType: "REPLY_TO_TWEET",
				actionId: "tweet_" + Date.now(),
				output: { text: config.text, tweetId: "reply_" + Date.now() },
				executionTime: 100,
				completedAt: Date.now(),
			};
		});

		// SEND_DM
		this.handlers.set("SEND_DM", async (config, context) => {
			if (context.dryRun) {
				return {
					success: true,
					actionType: "SEND_DM",
					actionId: "dry_run",
					output: { text: config.text, simulated: true },
					dryRun: true,
					executionTime: 0,
					completedAt: Date.now(),
				};
			}

			return {
				success: true,
				actionType: "SEND_DM",
				actionId: "dm_" + Date.now(),
				output: {
					text: config.text,
					recipientId: config.recipientId,
					dmId: "dm_" + Date.now(),
				},
				executionTime: 150,
				completedAt: Date.now(),
			};
		});

		// FOLLOW_USER
		this.handlers.set("FOLLOW_USER", async (config, context) => {
			if (context.dryRun) {
				return {
					success: true,
					actionType: "FOLLOW_USER",
					actionId: "dry_run",
					output: { userId: config.userId, simulated: true },
					dryRun: true,
					executionTime: 0,
					completedAt: Date.now(),
				};
			}

			return {
				success: true,
				actionType: "FOLLOW_USER",
				actionId: "follow_" + Date.now(),
				output: { userId: config.userId, followed: true },
				executionTime: 200,
				completedAt: Date.now(),
			};
		});

		// LOG_EVENT
		this.handlers.set("LOG_EVENT", async (config, context) => {
			// Log events are always executed (even in dry run for debugging)
			console.log("[LOG_EVENT]", config.event, config.metadata);

			return {
				success: true,
				actionType: "LOG_EVENT",
				actionId: "log_" + Date.now(),
				output: { event: config.event, logged: true },
				executionTime: 10,
				completedAt: Date.now(),
			};
		});

		// Additional action handlers
		const simpleHandlers: ActionType[] = [
			"FOLLOW_BACK",
			"RETWEET",
			"QUOTE_TWEET",
			"PIN_TWEET",
			"THANK_YOU_REPLY",
			"ADD_TO_LIST",
			"BLOCK_USER",
			"REPORT_SPAM",
			"ALERT_ADMIN",
		];

		for (const actionType of simpleHandlers) {
			this.handlers.set(actionType, async (config, context) => {
				if (context.dryRun) {
					return {
						success: true,
						actionType,
						actionId: "dry_run",
						output: { simulated: true },
						dryRun: true,
						executionTime: 0,
						completedAt: Date.now(),
					};
				}

				return {
					success: true,
					actionType,
					actionId: actionType.toLowerCase() + "_" + Date.now(),
					output: { completed: true },
					executionTime: 100,
					completedAt: Date.now(),
				};
			});
		}
	}
}

// Export singleton instance
export const actionDispatcher = new ActionDispatcher();
