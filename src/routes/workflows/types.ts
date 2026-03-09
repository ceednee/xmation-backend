export interface TriggerInput {
	type: string;
	config?: Record<string, unknown>;
}

export interface ActionInput {
	type: string;
	config?: Record<string, unknown>;
	delay?: number;
}

export interface WorkflowBody {
	name: string;
	description?: string;
	isDryRun?: boolean;
	triggers: TriggerInput[];
	actions: ActionInput[];
}

export interface UpdateWorkflowBody {
	name?: string;
	description?: string;
	isDryRun?: boolean;
	triggers?: TriggerInput[];
	actions?: ActionInput[];
}

export interface TestWorkflowBody {
	triggerData?: Record<string, unknown>;
}

// Aliases for backward compatibility
export type CreateWorkflowRequest = WorkflowBody;
export type UpdateWorkflowRequest = UpdateWorkflowBody;

export interface WorkflowResponse {
	success: boolean;
	data?: unknown;
	error?: {
		code: string;
		message: string;
	};
}

export interface WorkflowListResponse {
	success: boolean;
	data: unknown[];
	meta: {
		total: number;
	};
}
