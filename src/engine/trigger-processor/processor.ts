import type { Workflow } from "../../types";
import type { TriggerContext, TriggerEvaluator } from "../../triggers/types";
import type { EvaluationResult, QueuedWorkflow } from "./types";
import { WorkflowQueue } from "./queue";
import { createEvaluatorMap } from "./evaluators";
import { evaluateWorkflowTriggers } from "./evaluator";
import { WorkflowRunner, type WorkflowExecutionResult } from "../workflow-runner";

const createErrorResult = (workflow: Workflow, error: unknown): WorkflowExecutionResult => ({
	success: false,
	workflowId: workflow._id,
	userId: workflow.userId,
	status: "failed",
	mode: workflow.isDryRun ? "dry_run" : "live",
	actionsExecuted: 0,
	actionsFailed: 0,
	logs: ["Execution failed"],
	error: error instanceof Error ? error.message : String(error),
	startedAt: Date.now(),
	completedAt: Date.now(),
});

export class TriggerProcessor {
	private queue: WorkflowQueue = new WorkflowQueue();
	private workflowRunner: WorkflowRunner;
	private evaluators: Map<string, TriggerEvaluator>;

	constructor() {
		this.workflowRunner = new WorkflowRunner();
		this.evaluators = createEvaluatorMap();
	}

	async evaluateWorkflow(workflow: Workflow, context: TriggerContext): Promise<EvaluationResult> {
		return evaluateWorkflowTriggers(workflow, context, this.evaluators);
	}

	async queueWorkflow(workflow: Workflow, context: TriggerContext): Promise<boolean> {
		const evaluation = await this.evaluateWorkflow(workflow, context);
		return this.queue.add(workflow, context, evaluation);
	}

	async processQueue(): Promise<WorkflowExecutionResult[]> {
		const results: WorkflowExecutionResult[] = [];

		while (this.queue.size > 0) {
			const item = this.queue.shift();
			if (!item) continue;

			try {
				const result = await this.executeWorkflow(item);
				results.push(result);
			} catch (error) {
				console.error("Error executing workflow:", error);
				results.push(createErrorResult(item.workflow, error));
			}
		}

		return results;
	}

	private async executeWorkflow(item: QueuedWorkflow): Promise<WorkflowExecutionResult> {
		const triggerData: Record<string, unknown> = {
			...item.context,
			triggerType: item.triggerType,
			triggerData: item.triggerData,
		};

		return this.workflowRunner.execute(item.workflow, triggerData);
	}

	async processWorkflows(
		workflows: Workflow[],
		context: TriggerContext
	): Promise<Array<EvaluationResult & { workflowId: string }>> {
		const results: Array<EvaluationResult & { workflowId: string }> = [];

		for (const workflow of workflows) {
			const evaluation = await this.evaluateWorkflow(workflow, context);
			results.push({ ...evaluation, workflowId: workflow._id });

			if (evaluation.shouldTrigger) {
				await this.queueWorkflow(workflow, context);
			}
		}

		return results;
	}

	getQueueSize(): number {
		return this.queue.size;
	}

	clearQueue(): void {
		this.queue.clear();
	}

	registerEvaluator(triggerType: string, evaluator: TriggerEvaluator): void {
		this.evaluators.set(triggerType, evaluator);
	}

	getRegisteredEvaluatorTypes(): string[] {
		return Array.from(this.evaluators.keys());
	}
}

export const triggerProcessor = new TriggerProcessor();
