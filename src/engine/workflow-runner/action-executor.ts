import type { ActionConfig } from "../../types";
import type { ExecutionContext, ExecutionState } from "./types";
import { SingleActionExecutor, handleExecutionSuccess, handleExecutionFailure, handleExecutionError } from "./executor";
import { sleep } from "./delay";

export class ActionExecutor {
	private singleExecutor: SingleActionExecutor;

	constructor() {
		this.singleExecutor = new SingleActionExecutor();
	}

	async executeWithDelay(action: ActionConfig, context: ExecutionContext, state: ExecutionState): Promise<void> {
		state.logs.push(`Executing action: ${action.type} (${action.id})`);

		if (action.delay && action.delay > 0) {
			state.logs.push(`Waiting ${action.delay}ms before executing`);
			await sleep(action.delay);
		}

		const result = await this.singleExecutor.execute(action, context);

		if (result.success) {
			handleExecutionSuccess(action.type, state);
		} else {
			handleExecutionFailure(action.type, result.error, state);
		}
	}

	async executeWithErrorHandling(action: ActionConfig, context: ExecutionContext, state: ExecutionState): Promise<void> {
		try {
			await this.executeWithDelay(action, context, state);
		} catch (error) {
			handleExecutionError(action.type, error, state);
		}
	}
}
