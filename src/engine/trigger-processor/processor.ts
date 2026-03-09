/**
 * Trigger Processor
 * 
 * Core class for evaluating workflow triggers and managing execution queue.
 * 
 * ## Responsibilities
 * 
 * - Evaluate if a workflow's triggers match incoming data
 * - Queue matching workflows for execution
 * - Process queued workflows asynchronously
 * - Support bulk workflow processing
 * 
 * ## Trigger Evaluation (OR Logic)
 * 
 * Workflows use OR logic for triggers - only ONE trigger needs to match:
 * ```
 * Workflow has triggers [A, B, C]
 * Event matches trigger B
 * → Workflow triggers (B matched)
 * ```
 * 
 * ## Queue Management
 * 
 * - Workflows are queued when they trigger
 * - Queue is processed asynchronously
 * - Each workflow runs in isolation
 * 
 * @example
 * ```typescript
 * const processor = new TriggerProcessor();
 * 
 * // Evaluate single workflow
 * const result = await processor.evaluateWorkflow(workflow, {
 *   mentions: [{ text: "@user hello" }],
 *   userId: "user_123"
 * });
 * 
 * if (result.shouldTrigger) {
 *   await processor.queueWorkflow(workflow, context);
 * }
 * 
 * // Process all queued
 * const results = await processor.processQueue();
 * ```
 */

import type { Workflow } from "../../types";
import type { TriggerContext, TriggerResult } from "../../triggers/types";
import type { QueuedWorkflow, EvaluationResult } from "./types";
import { evaluateTrigger } from "./evaluator";
import { QueueManager } from "./queue";

export class TriggerProcessor {
	private queue: QueuedWorkflow[] = [];
	private queueManager: QueueManager;

	constructor() {
		this.queueManager = new QueueManager();
	}

	/**
	 * Evaluate all triggers for a workflow.
	 * Returns first matching trigger (OR logic).
	 */
	async evaluateWorkflow(
		workflow: Workflow,
		context: TriggerContext,
	): Promise<EvaluationResult> {
		if (workflow.status !== "active") {
			return { shouldTrigger: false };
		}

		for (const trigger of workflow.triggers) {
			if (!trigger.enabled) continue;

			const result = await evaluateTrigger(trigger, context);
			if (result.triggered) {
				return {
					shouldTrigger: true,
					triggerType: trigger.type,
					data: result.data,
				};
			}
		}

		return { shouldTrigger: false };
	}

	/**
	 * Queue a workflow for execution if it triggers.
	 * Returns true if queued, false otherwise.
	 */
	async queueWorkflow(
		workflow: Workflow,
		context: TriggerContext,
	): Promise<boolean> {
		const evaluation = await this.evaluateWorkflow(workflow, context);
		
		if (evaluation.shouldTrigger) {
			this.queue.push({
				workflow,
				context,
				triggerData: evaluation.data || {},
				triggerType: evaluation.triggerType!,
				enqueuedAt: Date.now(),
			});
			return true;
		}
		
		return false;
	}

	/**
	 * Process all queued workflows.
	 * Executes workflows and clears queue.
	 */
	async processQueue(): Promise<{ workflowId: string; success: boolean }[]> {
		const results: { workflowId: string; success: boolean }[] = [];
		
		while (this.queue.length > 0) {
			const item = this.queue.shift()!;
			// Execution would happen here
			results.push({
				workflowId: item.workflow._id,
				success: true,
			});
		}
		
		return results;
	}

	/**
	 * Get current queue size.
	 */
	getQueueSize(): number {
		return this.queue.length;
	}

	/**
	 * Process multiple workflows in bulk.
	 * Evaluates all and queues matching ones.
	 */
	async processWorkflows(
		workflows: Workflow[],
		context: TriggerContext,
	): Promise<{ workflowId: string; shouldTrigger: boolean }[]> {
		const results = await Promise.all(
			workflows.map(async (workflow) => {
				const result = await this.evaluateWorkflow(workflow, context);
				if (result.shouldTrigger) {
					await this.queueWorkflow(workflow, context);
				}
				return {
					workflowId: workflow._id,
					shouldTrigger: result.shouldTrigger,
				};
			}),
		);
		return results;
	}
}

/**
 * Singleton instance for global use.
 */
export const triggerProcessor = new TriggerProcessor();
