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
