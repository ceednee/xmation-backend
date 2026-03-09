import type { Workflow } from "../../types";
import type { TriggerContext, TriggerEvaluator } from "../../triggers/types";
import type { EvaluationResult } from "./types";

export const evaluateSingleTrigger = async (
	triggerType: string,
	triggerConfig: Record<string, unknown>,
	triggerEnabled: boolean,
	evaluator: TriggerEvaluator | undefined,
	context: TriggerContext,
): Promise<EvaluationResult> => {
	if (!triggerEnabled) {
		return { shouldTrigger: false };
	}

	if (!evaluator) {
		console.warn(`No evaluator found for trigger type: ${triggerType}`);
		return { shouldTrigger: false };
	}

	try {
		const result = await evaluator(triggerConfig, context);

		if (result.triggered) {
			return {
				shouldTrigger: true,
				triggerType,
				data: result.data,
			};
		}
	} catch (error) {
		console.error(`Error evaluating trigger ${triggerType}:`, error);
	}

	return { shouldTrigger: false };
};

export const evaluateWorkflowTriggers = async (
	workflow: Workflow,
	context: TriggerContext,
	evaluators: Map<string, TriggerEvaluator>
): Promise<EvaluationResult> => {
	if (workflow.status !== "active") {
		return { shouldTrigger: false };
	}

	for (const trigger of workflow.triggers) {
		const evaluator = evaluators.get(trigger.type);
		const result = await evaluateSingleTrigger(
			trigger.type,
			trigger.config,
			trigger.enabled,
			evaluator,
			context
		);

		if (result.shouldTrigger) {
			return result;
		}
	}

	return { shouldTrigger: false };
};
