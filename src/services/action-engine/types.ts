import type { ActionResult } from "../../actions/types";
import type { ActionConfig, Workflow } from "../../types";

export interface WorkflowExecutionResult {
	workflowId: string;
	runId: string;
	success: boolean;
	actions: ActionResult[];
	startedAt: number;
	completedAt: number;
	error?: string;
}

export interface Condition {
	field: string;
	operator: string;
	value: unknown;
}

export interface ActionFilter {
	action: ActionConfig;
	context: ActionContext;
	results: ActionResult[];
}

export interface ActionExecutor {
	action: ActionConfig;
	context: ActionContext;
}

export interface ActionContext {
	userId: string;
	xUserId: string | undefined;
	workflowId: string;
	runId: string;
	triggerData: Record<string, unknown>;
	previousResults: ActionResult[];
	dryRun: boolean;
}

export interface WorkflowExecutor {
	workflow: Workflow;
	triggerData: Record<string, unknown>;
	context: BaseActionContext;
}

export interface BaseActionContext {
	userId: string;
	xUserId: string | undefined;
	dryRun: boolean;
}
