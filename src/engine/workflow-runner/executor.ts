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

/**
 * Execute multiple actions sequentially.
 * Handles delays between actions and error aggregation.
 */
export async function executeActions(
	actions: ActionConfig[],
	context: ExecutionContext,
): Promise<{
	actionsExecuted: number;
	actionsFailed: number;
	hasErrors: boolean;
	firstError?: string;
	logs: string[];
}> {
	const state: ExecutionState = {
		actionsExecuted: 0,
		actionsFailed: 0,
		hasErrors: false,
		logs: [],
	};

	const executor = new SingleActionExecutor();

	for (const action of actions) {
		// Handle delay
		if (action.delay && action.delay > 0) {
			await sleep(Math.min(action.delay, 5000));
		}

		try {
			const result = await executor.execute(action, context);
			if (result.success) {
				handleExecutionSuccess(action.type, state);
			} else {
				handleExecutionFailure(action.type, result.error, state);
				if (action.config.continueOnError !== true) {
					break;
				}
			}
		} catch (error) {
			handleExecutionError(action.type, error, state);
			if (action.config.continueOnError !== true) {
				break;
			}
		}
	}

	return state;
}
