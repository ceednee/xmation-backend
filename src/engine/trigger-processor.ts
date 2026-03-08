/**
 * Trigger Processor
 * 
 * Evaluates workflow triggers and queues workflows for execution
 * when trigger conditions are met.
 */

import type { Workflow } from "../types";
import type { TriggerContext, TriggerResult, TriggerEvaluator } from "../triggers/types";
import {
	newMentionEvaluator,
	newFollowerEvaluator,
	contentGapEvaluator,
	highEngagementEvaluator,
	optimalPostTimeEvaluator,
	newReplyEvaluator,
	postRepostedEvaluator,
	unfollowDetectedEvaluator,
	newDMEvaluator,
	manualTriggerEvaluator,
	negativeSentimentEvaluator,
	linkBrokenEvaluator,
} from "../triggers/evaluators";
import { WorkflowRunner, type WorkflowExecutionResult } from "./workflow-runner";

interface QueuedWorkflow {
	workflow: Workflow;
	context: TriggerContext;
	triggerType: string;
	triggerData: unknown;
	enqueuedAt: number;
}

interface EvaluationResult {
	shouldTrigger: boolean;
	triggerType?: string;
	data?: Record<string, unknown>;
}

/**
 * Trigger Processor
 */
export class TriggerProcessor {
	private queue: QueuedWorkflow[] = [];
	private workflowRunner: WorkflowRunner;
	private running = false;

	// Map trigger types to evaluators
	private evaluators: Map<string, TriggerEvaluator> = new Map([
		["NEW_MENTION", newMentionEvaluator],
		["NEW_FOLLOWER", newFollowerEvaluator],
		["CONTENT_GAP", contentGapEvaluator],
		["HIGH_ENGAGEMENT", highEngagementEvaluator],
		["OPTIMAL_POST_TIME", optimalPostTimeEvaluator],
		["NEW_REPLY", newReplyEvaluator],
		["POST_REPOSTED", postRepostedEvaluator],
		["UNFOLLOW_DETECTED", unfollowDetectedEvaluator],
		["NEW_DM", newDMEvaluator],
		["MANUAL_TRIGGER", manualTriggerEvaluator],
		["NEGATIVE_SENTIMENT", negativeSentimentEvaluator],
		["LINK_BROKEN", linkBrokenEvaluator],
	]);

	constructor() {
		this.workflowRunner = new WorkflowRunner();
	}

	/**
	 * Evaluate a single workflow's triggers
	 */
	async evaluateWorkflow(
		workflow: Workflow,
		context: TriggerContext
	): Promise<EvaluationResult> {
		// Skip inactive workflows
		if (workflow.status !== "active") {
			return { shouldTrigger: false };
		}

		// Evaluate each trigger (OR logic - any trigger can activate)
		for (const trigger of workflow.triggers) {
			// Skip disabled triggers
			if (!trigger.enabled) {
				continue;
			}

			const evaluator = this.evaluators.get(trigger.type);
			if (!evaluator) {
				console.warn(`No evaluator found for trigger type: ${trigger.type}`);
				continue;
			}

			try {
				const result = await evaluator(trigger.config, context);

				if (result.triggered) {
					return {
						shouldTrigger: true,
						triggerType: trigger.type,
						data: result.data,
					};
				}
			} catch (error) {
				console.error(`Error evaluating trigger ${trigger.type}:`, error);
			}
		}

		return { shouldTrigger: false };
	}

	/**
	 * Queue a workflow for execution if triggered
	 */
	async queueWorkflow(
		workflow: Workflow,
		context: TriggerContext
	): Promise<boolean> {
		const evaluation = await this.evaluateWorkflow(workflow, context);

		if (!evaluation.shouldTrigger) {
			return false;
		}

		// Add to queue
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
	 * Process all queued workflows
	 */
	async processQueue(): Promise<WorkflowExecutionResult[]> {
		const results: WorkflowExecutionResult[] = [];

		while (this.queue.length > 0) {
			const item = this.queue.shift();
			if (!item) continue;

			try {
				// Merge trigger data into context
				const triggerData: Record<string, unknown> = {
					...item.context,
					triggerType: item.triggerType,
					triggerData: item.triggerData,
				};

				const result = await this.workflowRunner.execute(
					item.workflow,
					triggerData
				);

				results.push(result);
			} catch (error) {
				console.error("Error executing workflow:", error);
				results.push({
					success: false,
					workflowId: item.workflow._id,
					userId: item.workflow.userId,
					status: "failed",
					mode: item.workflow.isDryRun ? "dry_run" : "live",
					actionsExecuted: 0,
					actionsFailed: 0,
					logs: ["Execution failed"],
					error:
						error instanceof Error ? error.message : String(error),
					startedAt: Date.now(),
					completedAt: Date.now(),
				});
			}
		}

		return results;
	}

	/**
	 * Process multiple workflows
	 */
	async processWorkflows(
		workflows: Workflow[],
		context: TriggerContext
	): Promise<Array<EvaluationResult & { workflowId: string }>> {
		const results: Array<EvaluationResult & { workflowId: string }> = [];

		for (const workflow of workflows) {
			const evaluation = await this.evaluateWorkflow(workflow, context);

			results.push({
				...evaluation,
				workflowId: workflow._id,
			});

			// Auto-queue if triggered
			if (evaluation.shouldTrigger) {
				await this.queueWorkflow(workflow, context);
			}
		}

		return results;
	}

	/**
	 * Get current queue size
	 */
	getQueueSize(): number {
		return this.queue.length;
	}

	/**
	 * Clear the queue
	 */
	clearQueue(): void {
		this.queue = [];
	}

	/**
	 * Register a custom evaluator
	 */
	registerEvaluator(triggerType: string, evaluator: TriggerEvaluator): void {
		this.evaluators.set(triggerType, evaluator);
	}

	/**
	 * Get registered evaluator types
	 */
	getRegisteredEvaluatorTypes(): string[] {
		return Array.from(this.evaluators.keys());
	}
}

// Export singleton instance
export const triggerProcessor = new TriggerProcessor();
