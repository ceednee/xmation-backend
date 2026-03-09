/**
 * Workflow Runner Types
 * 
 * Defines types for workflow execution including results, context,
 * and execution state. The workflow runner orchestrates the execution
 * of actions when triggers fire.
 */

import type { Workflow } from "../../types";

/**
 * Result of workflow execution
 * 
 * @property success - Whether all actions completed successfully
 * @property workflowId - ID of the executed workflow
 * @property userId - Owner of the workflow
 * @property status - Execution outcome (completed, failed, partial)
 * @property mode - Execution mode (live or dry_run)
 * @property actionsExecuted - Number of actions that ran
 * @property actionsFailed - Number of actions that failed
 * @property logs - Execution log messages
 * @property error - Error message if workflow failed
 * @property startedAt - Start timestamp
 * @property completedAt - End timestamp
 * @property context - Execution context data
 */
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

/**
 * Context for workflow execution
 * 
 * Passed through the execution pipeline to provide
 * workflow metadata and user credentials.
 */
export interface ExecutionContext {
	workflowId: string;
	userId: string;
	runId: string;
	xAccessToken?: string;
	triggerData: Record<string, unknown>;
	dryRun?: boolean;
	previousResults?: Array<{ success: boolean; actionType: string; error?: string }>;
}

/**
 * Mutable state tracked during workflow execution
 * 
 * Updated as actions execute to track progress and errors.
 */
export interface ExecutionState {
	actionsExecuted: number;
	actionsFailed: number;
	hasErrors: boolean;
	firstError?: string;
	logs: string[];
}
