import type { Workflow } from "../../types";
import type { TriggerContext } from "../../triggers/types";
import type { QueuedWorkflow, EvaluationResult } from "./types";

export class WorkflowQueue {
	private queue: QueuedWorkflow[] = [];

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

	shift(): QueuedWorkflow | undefined {
		return this.queue.shift();
	}

	get size(): number {
		return this.queue.length;
	}

	clear(): void {
		this.queue = [];
	}
}
