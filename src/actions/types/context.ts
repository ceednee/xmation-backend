import type { ActionResult } from "./core";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface TriggerData {
	[key: string]: unknown;
}

// Context passed to action executors
export interface ActionContext {
	userId: string;
	xUserId?: string;
	workflowId: string;
	runId: string;
	triggerData: Record<string, TriggerData>;
	previousResults?: ActionResult[];
	dryRun: boolean;
}
