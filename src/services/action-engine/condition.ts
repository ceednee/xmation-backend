import type { Condition } from "./types";

type OperatorFn = (fieldValue: unknown, value: unknown) => boolean;

const operators: Record<string, OperatorFn> = {
	eq: (a, b) => a === b,
	ne: (a, b) => a !== b,
	gt: (a, b) => Number(a) > Number(b),
	lt: (a, b) => Number(a) < Number(b),
	gte: (a, b) => Number(a) >= Number(b),
	lte: (a, b) => Number(a) <= Number(b),
	contains: (a, b) => String(a).includes(String(b)),
};

export function evaluateCondition(
	condition: Condition,
	data: Record<string, unknown>,
): boolean {
	const { field, operator, value } = condition;
	const fieldValue = data[field];
	const op = operators[operator];
	return op ? op(fieldValue, value) : false;
}

export function shouldSkipAction(
	condition: unknown,
	data: Record<string, unknown>,
): boolean {
	if (!condition) return false;
	return !evaluateCondition(condition as Condition, data);
}
