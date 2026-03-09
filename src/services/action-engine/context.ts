/**
 * Action Context Builder
 * 
 * Builds execution contexts for actions.
 * 
 * ## Context Types
 * 
 * - **BaseActionContext**: Minimal context with user info
 * - **ActionContext**: Full context with workflow/trigger data
 * 
 * ## Context Flow
 * 
 * ```
 * createBaseContext(userId, xUserId, dryRun)
 *         ↓
 * createFullActionContext(base, workflowId, runId, triggerData)
 *         ↓
 * ActionContext (used by action executors)
 * ```
 * 
 * ## Context Properties
 * 
 * | Property | Description |
 * |----------|-------------|
 * | `userId` | Workflow owner's user ID |
 * | `xUserId` | X (Twitter) user ID |
 * | `workflowId` | Current workflow ID |
 * | `runId` | Unique execution run ID |
 * | `triggerData` | Data that triggered the workflow |
 * | `previousResults` | Results from earlier actions |
 * | `dryRun` | If true, don't actually execute |
 * 
 * @example
 * ```typescript
 * // Create base context
 * const base = createBaseContext("user_123", "x_456", false);
 * 
 * // Create full context for execution
 * const context = createFullActionContext(
 *   base,
 *   "workflow_789",
 *   "run_abc",
 *   { mentionId: "m_123", text: "Hello" }
 * );
 * 
 * // Use in action execution
 * const result = await executeAction(action, context);
 * ```
 */

import type { BaseActionContext, ActionContext, TriggerData } from "./types";

/**
 * Create a base context with user information.
 * 
 * @param userId - Internal user ID
 * @param xUserId - X (Twitter) user ID
 * @param dryRun - Whether to simulate execution
 * @returns Base context
 */
export function createBaseContext(
	userId: string,
	xUserId: string | undefined,
	dryRun: boolean,
): BaseActionContext {
	return { userId, xUserId, dryRun };
}

/**
 * Create base action context (backward compatible with original signature).
 * 
 * @param userId - Internal user ID
 * @param xUserId - X (Twitter) user ID
 * @param dryRun - Whether to simulate execution
 * @returns Base context
 */
export function createActionContext(
	userId: string,
	xUserId: string | undefined,
	dryRun: boolean,
): BaseActionContext {
	return { userId, xUserId, dryRun };
}

/**
 * Create full action context for execution.
 * 
 * @param base - Base context with user info
 * @param workflowId - Workflow ID
 * @param runId - Unique run ID
 * @param triggerData - Data that triggered the workflow
 * @returns Full action context
 */
export function createFullActionContext(
	base: BaseActionContext,
	workflowId: string,
	runId: string,
	triggerData: Record<string, unknown>,
): ActionContext {
	return {
		...base,
		workflowId,
		runId,
		triggerData: triggerData as Record<string, TriggerData>,
		previousResults: [],
		dryRun: base.dryRun,
	};
}
