import type { Workflow } from "../../types";
import type { TriggerContext } from "../../triggers/types";

export interface QueuedWorkflow {
	workflow: Workflow;
	context: TriggerContext;
	triggerType: string;
	triggerData: unknown;
	enqueuedAt: number;
}

export interface EvaluationResult {
	shouldTrigger: boolean;
	triggerType?: string;
	data?: Record<string, unknown>;
}
