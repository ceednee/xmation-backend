/**
 * Internal Action Base Utilities
 * 
 * Shared utilities for internal action executors including:
 * - Result creation helpers (re-exported from utils)
 * - Condition evaluation for if/then/else logic
 * - Type definitions for internal actions
 * 
 * ## Condition Operators
 * - `eq` - Equal to
 * - `ne` - Not equal to
 * - `gt` - Greater than
 * - `lt` - Less than
 * - `gte` - Greater than or equal to
 * - `lte` - Less than or equal to
 * - `contains` - String contains substring
 */

import type { ActionContext } from "../../types";
import { createResult } from "../../utils";

// Re-export utilities for use in internal action executors
export { createResult };
export type { ActionContext };

/**
 * Condition definition for CONDITION_CHECK action
 * 
 * @property field - Field name to evaluate (from trigger data or context)
 * @property operator - Comparison operator (eq, ne, gt, lt, gte, lte, contains)
 * @property value - Value to compare against
 */
export interface Condition {
	field: string;
	operator: string;
	value: unknown;
}

/**
 * Evaluate a condition against trigger data and context
 * 
 * Supports numeric comparisons, equality checks, and string containment.
 * Field value is looked up first in triggerData, then in context.
 * 
 * @param condition - The condition to evaluate
 * @param triggerData - Data from the trigger event
 * @param context - Action execution context
 * @returns True if condition is met, false otherwise
 * 
 * @example
 * ```typescript
 * const condition = { field: "authorId", operator: "eq", value: "12345" };
 * const result = evaluateCondition(condition, triggerData, context);
 * ```
 */
export const evaluateCondition = (
	condition: Condition,
	triggerData: Record<string, unknown>,
	context: ActionContext,
): boolean => {
	const fieldValue = triggerData[condition.field] ?? context[condition.field as keyof ActionContext];

	switch (condition.operator) {
		case "eq":
			return fieldValue === condition.value;
		case "ne":
			return fieldValue !== condition.value;
		case "gt":
			return Number(fieldValue) > Number(condition.value);
		case "lt":
			return Number(fieldValue) < Number(condition.value);
		case "gte":
			return Number(fieldValue) >= Number(condition.value);
		case "lte":
			return Number(fieldValue) <= Number(condition.value);
		case "contains":
			return String(fieldValue).includes(String(condition.value));
		default:
			return false;
	}
};
