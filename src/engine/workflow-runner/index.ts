/**
 * Workflow Runner Module
 * 
 * Executes workflows by running their actions in sequence.
 * 
 * ## Key Concepts
 * 
 * - **Sequential Execution**: Actions run one after another (not parallel)
 * - **Action Context**: Each action receives context with trigger data and previous results
 * - **Error Handling**: Can stop on first error or continue based on config
 * - **Status Checks**: Respects workflow status (draft/paused/active)
 * 
 * ## Execution Flow
 * 
 * ```
 * execute(workflow, triggerData)
 *   ↓
 * Check status (paused/draft?) → Return early if inactive
 *   ↓
 * Build execution context
 *   ↓
 * For each action:
 *   - Check condition (skip if not met)
 *   - Execute action
 *   - Handle delay if specified
 *   - Stop on error (unless continueOnError=true)
 *   ↓
 * Build and return result
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * const runner = new WorkflowRunner();
 * const result = await runner.execute(workflow, { mentionId: "123" });
 * 
 * console.log(result.success);        // true/false
 * console.log(result.actionsExecuted); // number of actions run
 * console.log(result.logs);           // execution logs
 * ```
 */

export { WorkflowRunner, workflowRunner } from "./runner";
export { SingleActionExecutor } from "./executor";
export type { WorkflowExecutionResult, ExecutionContext } from "./types";
