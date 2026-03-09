import type { WorkflowExecutionResult } from "./types";

const MAX_HISTORY_SIZE = 100;

export class ExecutionHistory {
	private executionLog: Map<string, WorkflowExecutionResult[]> = new Map();

	get(workflowId: string): WorkflowExecutionResult[] {
		return this.executionLog.get(workflowId) || [];
	}

	log(workflowId: string, result: WorkflowExecutionResult): void {
		const history = this.get(workflowId);
		history.push(result);

		if (history.length > MAX_HISTORY_SIZE) {
			history.shift();
		}

		this.executionLog.set(workflowId, history);
	}
}
