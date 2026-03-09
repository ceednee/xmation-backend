/**
 * Action: CONDITION_CHECK
 * 
 * Evaluates a conditional expression against trigger data and context.
 * Supports if/then/else logic for workflow branching.
 * 
 * ## Configuration
 * - `condition` (required) - Condition object with:
 *   - `field` - Field name to evaluate
 *   - `operator` - Comparison operator (eq, ne, gt, lt, gte, lte, contains)
 *   - `value` - Value to compare against
 * - `then` (optional) - Actions to execute if condition is true
 * - `else` (optional) - Actions to execute if condition is false
 * 
 * ## Operators
 * - `eq` - Equal to
 * - `ne` - Not equal to
 * - `gt` - Greater than
 * - `lt` - Less than
 * - `gte` - Greater than or equal to
 * - `lte` - Less than or equal to
 * - `contains` - String contains
 * 
 * ## Context Data
 * - Evaluates against `triggerData` fields and context properties
 * 
 * ## Example
 * ```typescript
 * const config = {
 *   condition: { field: "authorId", operator: "eq", value: "12345" },
 *   then: [{ type: "REPLY_TO_TWEET", text: "Welcome back!" }],
 *   else: [{ type: "LOG_EVENT", eventType: "new_user" }]
 * };
 * const result = await conditionCheckExecutor(config, context);
 * ```
 */

import type { ActionExecutor } from "../../types";
import { createResult, evaluateCondition } from "./base";

/**
 * Executes CONDITION_CHECK action
 * Evaluates the condition and returns result with condition status
 * 
 * @param config - Action configuration with condition, then, and else
 * @param context - Action execution context
 * @returns Action result with condition evaluation details
 */
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
