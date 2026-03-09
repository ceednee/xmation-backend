// Action execution result
export interface ActionResult {
	success: boolean;
	actionType: string;
	output?: Record<string, unknown>;
	error?: string;
	executionTimeMs: number;
}

// Action executor function type
export type ActionExecutor = (
	config: Record<string, unknown>,
	context: import("./context").ActionContext,
) => Promise<ActionResult> | ActionResult;

// Action definition
export interface ActionDefinition {
	type: string;
	name: string;
	description: string;
	executor: ActionExecutor;
	defaultConfig?: Record<string, unknown>;
	requiredConfig?: string[];
}
