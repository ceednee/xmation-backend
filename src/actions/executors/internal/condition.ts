import type { ActionExecutor } from "../../types";
import { createResult, evaluateCondition } from "./base";

export const conditionCheckExecutor: ActionExecutor = async (config, context) => {
	const start = Date.now();

	try {
		const condition = config.condition as { field: string; operator: string; value: unknown } | undefined;
		const thenActions = config.then as unknown[] | undefined;
		const elseActions = config.else as unknown[] | undefined;

		if (!condition) {
			return createResult(false, "CONDITION_CHECK", Date.now() - start, undefined, "No condition provided");
		}

		const conditionMet = evaluateCondition(condition, context.triggerData as Record<string, unknown>, context);

		return createResult(true, "CONDITION_CHECK", Date.now() - start, {
			conditionMet,
			field: condition.field,
			operator: condition.operator,
			value: condition.value,
			actualValue: (context.triggerData as Record<string, unknown>)[condition.field] ?? context[condition.field as keyof typeof context],
			thenActions: thenActions?.length || 0,
			elseActions: elseActions?.length || 0,
		});
	} catch (error) {
		return createResult(false, "CONDITION_CHECK", Date.now() - start, undefined,
			error instanceof Error ? error.message : "Failed to evaluate condition");
	}
};
