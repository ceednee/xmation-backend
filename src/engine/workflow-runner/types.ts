import type { Workflow } from "../../types";

export interface WorkflowExecutionResult {
	success: boolean;
	workflowId: string;
	userId: string;
	status: "completed" | "failed" | "partial";
	mode: "live" | "dry_run";
	actionsExecuted: number;
	actionsFailed: number;
	logs: string[];
	error?: string;
	startedAt: number;
	completedAt: number;
	context?: Record<string, unknown>;
}

export interface ExecutionContext {
	userId: string;
	xAccessToken?: string;
	triggerData: Record<string, unknown>;
	dryRun?: boolean;
}

export interface ExecutionState {
	actionsExecuted: number;
	actionsFailed: number;
	hasErrors: boolean;
	firstError?: string;
	logs: string[];
}
