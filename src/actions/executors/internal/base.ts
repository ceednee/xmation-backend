import type { ActionContext } from "../../types";
import { createResult } from "../../utils";

export { createResult };
export type { ActionContext };

export interface Condition {
	field: string;
	operator: string;
	value: unknown;
}

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
