/**
 * Workflow Queue Management
 * 
 * Manages the queue of workflows that have been triggered and are
 * waiting for execution. Provides add, remove, and query operations.
 * 
 * @module trigger-processor/queue
 */

import type { Workflow } from "../../types";
import type { TriggerContext } from "../../triggers/types";
import type { QueuedWorkflow, EvaluationResult } from "./types";

/**
 * Workflow queue class.
 * 
 * @deprecated Use WorkflowQueue instead
 */
export class WorkflowQueue {
	/**
	 * @deprecated Use WorkflowQueue instead
	 */
	static QueueManager = WorkflowQueue;
}

/**
 * Manages the queue of workflows ready for execution.
 * 
 * The QueueManager handles adding workflows that have triggered,
 * retrieving them for execution, and maintaining queue state.
 * 
 * @example
 * ```typescript
 * const queue = new QueueManager();
 * 
 * // Add a workflow to the queue
 * const added = queue.add(workflow, context, evaluation);
 * 
 * // Get queue size
 * console.log(queue.size);
 * 
 * // Retrieve next workflow
 * const next = queue.shift();
 * 
 * // Clear the queue
 * queue.clear();
 * ```
 */
export class QueueManager extends WorkflowQueue {
	private queue: QueuedWorkflow[] = [];

	/**
	 * Add a workflow to the queue if evaluation indicates it should trigger.
	 * 
	 * @param workflow - The workflow to queue
	 * @param context - The trigger context
	 * @param evaluation - The evaluation result from trigger checking
	 * @returns True if the workflow was added to the queue, false otherwise
	 */
	add(workflow: Workflow, context: TriggerContext, evaluation: EvaluationResult): boolean {
		if (!evaluation.shouldTrigger) return false;

		this.queue.push({
			workflow,
			context,
			triggerType: evaluation.triggerType || "UNKNOWN",
			triggerData: evaluation.data,
			enqueuedAt: Date.now(),
		});

		return true;
	}

	/**
	 * Remove and return the next workflow from the queue.
	 * 
	 * @returns The next queued workflow, or undefined if queue is empty
	 */
	shift(): QueuedWorkflow | undefined {
		return this.queue.shift();
	}

	/**
	 * Get the current number of workflows in the queue.
	 */
	get size(): number {
		return this.queue.length;
	}

	/**
	 * Clear all workflows from the queue.
	 */
	clear(): void {
		this.queue = [];
	}
}
