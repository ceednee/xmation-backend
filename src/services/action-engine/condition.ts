/**
 * Condition Evaluator
 * 
 * Evaluates conditional expressions for action filtering.
 * 
 * ## Supported Operators
 * 
 * | Operator | Description | Example |
 * |----------|-------------|---------|
 * | `eq` | Equal | `{ field: "type", operator: "eq", value: "mention" }` |
 * | `ne` | Not equal | `{ field: "sentiment", operator: "ne", value: "spam" }` |
 * | `gt` | Greater than | `{ field: "followers", operator: "gt", value: 1000 }` |
 * | `lt` | Less than | `{ field: "age", operator: "lt", value: 24 }` |
 * | `gte` | Greater or equal | `{ field: "count", operator: "gte", value: 5 }` |
 * | `lte` | Less or equal | `{ field: "score", operator: "lte", value: 100 }` |
 * | `contains` | String contains | `{ field: "text", operator: "contains", value: "hello" }` |
 * 
 * ## Condition Structure
 * 
 * ```typescript
 * interface Condition {
 *   field: string;      // Field name in trigger data
 *   operator: string;   // Comparison operator
 *   value: unknown;     // Value to compare against
 * }
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * // Check if mention is positive
 * const isPositive = evaluateCondition(
 *   { field: "sentiment", operator: "eq", value: "positive" },
 *   { sentiment: "positive", text: "Great post!" }
 * );
 * // → true
 * 
 * // Check follower count threshold
 * const hasFollowers = evaluateCondition(
 *   { field: "followerCount", operator: "gt", value: 100 },
 *   { followerCount: 150 }
 * );
 * // → true
 * 
 * // Check if text contains keyword
 * const containsHelp = evaluateCondition(
 *   { field: "text", operator: "contains", value: "help" },
 *   { text: "I need help with this" }
 * );
 * // → true
 * ```
 */

import type { Condition } from "./types";

type OperatorFn = (fieldValue: unknown, value: unknown) => boolean;

/**
 * Map of operator names to their implementation functions.
 */
const operators: Record<string, OperatorFn> = {
	eq: (a, b) => a === b,
	ne: (a, b) => a !== b,
	gt: (a, b) => Number(a) > Number(b),
	lt: (a, b) => Number(a) < Number(b),
	gte: (a, b) => Number(a) >= Number(b),
	lte: (a, b) => Number(a) <= Number(b),
	contains: (a, b) => String(a).includes(String(b)),
};

/**
 * Evaluate a condition against data.
 * 
 * @param condition - The condition to evaluate
 * @param data - The data object to check against
 * @returns true if condition is met, false otherwise
 */
export function evaluateCondition(
	condition: Condition,
	data: Record<string, unknown>,
): boolean {
	const { field, operator, value } = condition;
	const fieldValue = data[field];
	const op = operators[operator];
	return op ? op(fieldValue, value) : false;
}

/**
 * Check if an action should be skipped based on its condition.
 * 
 * @param condition - The condition (undefined means no condition)
 * @param data - The data to evaluate against
 * @returns true if action should be skipped
 */
export function shouldSkipAction(
	condition: unknown,
	data: Record<string, unknown>,
): boolean {
	if (!condition) return false;
	return !evaluateCondition(condition as Condition, data);
}
