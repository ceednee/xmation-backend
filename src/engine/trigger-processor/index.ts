/**
 * Trigger Processor Module
 * 
 * Evaluates workflow triggers against incoming events and manages workflow execution queue.
 * 
 * ## Key Concepts
 * 
 * - **Trigger Evaluation**: Checks if trigger conditions match incoming data (mentions, followers, etc.)
 * - **OR Logic**: Workflows trigger if ANY of their triggers match (not all)
 * - **Queue Management**: Matched workflows are queued for async execution
 * 
 * ## Workflow
 * 
 * ```
 * Event → evaluateWorkflow() → Queue → processQueue() → Execute
 *                ↓
 *          Check each trigger
 *          (first match wins)
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * const processor = new TriggerProcessor();
 * 
 * // Evaluate single workflow
 * const result = await processor.evaluateWorkflow(workflow, context);
 * if (result.shouldTrigger) {
 *   await processor.queueWorkflow(workflow, context);
 * }
 * 
 * // Process all queued workflows
 * const results = await processor.processQueue();
 * ```
 */

export { TriggerProcessor, triggerProcessor } from "./processor";
export { WorkflowQueue } from "./queue";
export type { QueuedWorkflow, EvaluationResult } from "./types";
