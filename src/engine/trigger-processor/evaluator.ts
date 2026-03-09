/**
 * Trigger Evaluation Engine
 * 
 * Core functions for evaluating workflow triggers against incoming events.
 * Provides single trigger evaluation and workflow-level trigger evaluation.
 * 
 * @module trigger-processor/evaluator
 */

import type { Workflow, TriggerConfig } from "../../types";
import type { TriggerContext, TriggerEvaluator, TriggerResult } from "../../triggers/types";
import type { EvaluationResult } from "./types";
import { getTriggerDefinition } from "../../triggers/evaluators";

/**
 * Evaluate a single trigger with the given configuration and context.
 * 
 * This is a low-level evaluation function that checks if a trigger should fire
 * based on its configuration and the incoming event context.
 * 
 * @param triggerType - The type of trigger being evaluated
 * @param triggerConfig - Configuration for this trigger instance
 * @param triggerEnabled - Whether this trigger is enabled
 * @param evaluator - The evaluator function for this trigger type
 * @param context - The trigger context containing event data
 * @returns Promise resolving to the evaluation result
 */
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
 * Evaluate a single trigger using its definition.
 * 
 * Looks up the trigger definition and runs its evaluator with merged
 * default configuration. This is the preferred high-level evaluation function.
 * 
 * @param trigger - The trigger configuration to evaluate
 * @param context - The trigger context containing event data
 * @returns Promise resolving to the trigger result
 * 
 * @example
 * ```typescript
 * const result = await evaluateTrigger(
 *   { type: "NEW_MENTION", config: { keywords: ["hello"] }, enabled: true },
 *   { mentions: [{ text: "@user hello" }], userId: "user_1" }
 * );
 * // result.triggered will be true if conditions match
 * ```
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

/**
 * Evaluate all triggers for a workflow.
 * 
 * Uses OR logic - returns on the first matching trigger. Only active
 * workflows are evaluated. Disabled triggers are skipped.
 * 
 * @param workflow - The workflow whose triggers should be evaluated
 * @param context - The trigger context containing event data
 * @param evaluators - Map of trigger types to their evaluator functions
 * @returns Promise resolving to the evaluation result
 * 
 * @example
 * ```typescript
 * const evaluators = new Map([["NEW_MENTION", mentionEvaluator]]);
 * const result = await evaluateWorkflowTriggers(workflow, context, evaluators);
 * if (result.shouldTrigger) {
 *   console.log(`Triggered by: ${result.triggerType}`);
 * }
 * ```
 */
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
