import type { ActionConfig } from "../../types";
import type { ActionExecutionResult, ActionContext } from "./types";
import { substituteTemplates } from "./template";
import { createErrorResult } from "./result";
import { HandlerRegistry } from "./registry";

export class ActionDispatcher {
	private registry: HandlerRegistry;

	constructor() {
		this.registry = new HandlerRegistry();
	}

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

	hasHandler(actionType: string): boolean {
		return this.registry.has(actionType);
	}

	registerHandler(actionType: string, handler: import("./types").ActionHandler): void {
		this.registry.set(actionType, handler);
	}
}

export const actionDispatcher = new ActionDispatcher();
