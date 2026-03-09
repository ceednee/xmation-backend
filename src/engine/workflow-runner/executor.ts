import type { ActionConfig } from "../../types";
import type { ExecutionContext, ExecutionState } from "./types";
import { ActionDispatcher } from "../action-dispatcher";
import { sleep } from "./delay";

export class SingleActionExecutor {
	private actionDispatcher: ActionDispatcher;

	constructor() {
		this.actionDispatcher = new ActionDispatcher();
	}

	async execute(action: ActionConfig, context: ExecutionContext): Promise<{ success: boolean; error?: string }> {
		const result = await this.actionDispatcher.execute(action, context);
		return { success: result.success, error: result.error };
	}
}

export const handleExecutionSuccess = (actionType: string, state: ExecutionState): void => {
	state.actionsExecuted++;
	state.logs.push(`Action completed: ${actionType}`);
};

export const handleExecutionFailure = (actionType: string, error: string | undefined, state: ExecutionState): void => {
	state.actionsFailed++;
	state.hasErrors = true;
	state.logs.push(`Action failed: ${actionType} - ${error}`);
	if (!state.firstError) {
		state.firstError = error;
	}
};

export const handleExecutionError = (actionType: string, error: unknown, state: ExecutionState): void => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	state.actionsFailed++;
	state.hasErrors = true;
	state.logs.push(`Action error: ${actionType} - ${errorMessage}`);
	if (!state.firstError) {
		state.firstError = errorMessage;
	}
};
