/**
 * Action Engine Module
 * 
 * Core service for executing individual actions and complete workflows.
 * 
 * ## Key Concepts
 * 
 * - **Action Execution**: Validates and runs a single action with proper error handling
 * - **Workflow Execution**: Runs all actions in a workflow sequentially
 * - **Condition Evaluation**: Supports conditional action execution
 * - **Context Building**: Creates execution context with user/workflow/trigger data
 * 
 * ## Module Structure
 * 
 * - `executor.ts` - Single action execution with validation
 * - `workflow-executor.ts` - Multi-action workflow orchestration
 * - `condition.ts` - Condition evaluation logic (eq, gt, contains, etc.)
 * - `context.ts` - Context building utilities
 * 
 * ## Usage
 * 
 * ```typescript
 * // Execute single action
 * const result = await executeAction(actionConfig, context);
 * 
 * // Execute full workflow
 * const result = await executeWorkflowActions(
 *   workflow,
 *   triggerData,
 *   { userId: "u1", xUserId: "x1", dryRun: false }
 * );
 * 
 * // Check condition
 * const shouldRun = evaluateCondition(
 *   { field: "tweet.text", operator: "contains", value: "hello" },
 *   triggerData
 * );
 * ```
 */

export { executeAction } from "./executor";
export { executeWorkflowActions } from "./workflow-executor";
export { createActionContext, createBaseContext } from "./context";
export { evaluateCondition, shouldSkipAction } from "./condition";
export type {
	WorkflowExecutionResult,
	Condition,
	ActionContext,
	BaseActionContext,
} from "./types";
