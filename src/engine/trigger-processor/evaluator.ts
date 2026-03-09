import type { Workflow, TriggerConfig } from "../../types";
import type { TriggerContext, TriggerEvaluator, TriggerResult } from "../../triggers/types";
import type { EvaluationResult } from "./types";
import { getTriggerDefinition } from "../../triggers/evaluators";

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

/**
 * Evaluate a single trigger.
 * Looks up the trigger definition and runs its evaluator.
 */
export async function evaluateTrigger(
	trigger: TriggerConfig,
	context: TriggerContext,
): Promise<TriggerResult> {
	const definition = getTriggerDefinition(trigger.type);

	if (!definition) {
		return {
			triggered: false,
			triggerType: trigger.type,
			timestamp: Date.now(),
		};
	}

	// Merge default config with trigger config
	const config = {
		...definition.defaultConfig,
		...trigger.config,
	};

	try {
		const result = await definition.evaluator(config, context);
		return result;
	} catch (error) {
		console.error(`Trigger evaluation failed for ${trigger.type}:`, error);
		return {
			triggered: false,
			triggerType: trigger.type,
			timestamp: Date.now(),
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

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
