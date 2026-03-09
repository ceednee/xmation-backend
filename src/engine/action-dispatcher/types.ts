import type { ActionConfig } from "../../types";

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

export type ActionHandler = (
	config: Record<string, unknown>,
	context: ActionContext
) => Promise<ActionExecutionResult>;

export interface ActionDispatcherConfig {
	action: ActionConfig;
	context: ActionContext;
	startTime: number;
}

/**
 * @deprecated Use ActionContext instead
 */
export type DispatchContext = ActionContext;

/**
 * @deprecated Use ActionExecutionResult instead
 */
export type DispatchResult = ActionExecutionResult;
