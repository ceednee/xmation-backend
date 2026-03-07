import { getTriggerDefinition } from "../triggers/evaluators";
import type {
	DMData,
	FollowerData,
	LinkData,
	MentionData,
	PostData,
	ReplyData,
	RetweetData,
	TriggerContext,
	TriggerResult,
} from "../triggers/types";
import type { TriggerConfig, Workflow } from "../types";

export interface EvaluationResult {
	workflowId: string;
	triggered: boolean;
	triggers: TriggerResult[];
	timestamp: number;
}

/**
 * Evaluate a single trigger
 */
export async function evaluateTrigger(
	trigger: TriggerConfig,
	context: TriggerContext,
): Promise<TriggerResult> {
	const definition = getTriggerDefinition(trigger.type);

	if (!definition) {
		return {
			triggered: false,
			triggerType: trigger.type,
			timestamp: Date.now(),
		};
	}

	// Merge default config with trigger config
	const config = {
		...definition.defaultConfig,
		...trigger.config,
	};

	try {
		const result = await definition.evaluator(config, context);
		return result;
	} catch (error) {
		console.error(`Trigger evaluation failed for ${trigger.type}:`, error);
		return {
			triggered: false,
			triggerType: trigger.type,
			timestamp: Date.now(),
		};
	}
}

/**
 * Evaluate all triggers for a workflow
 */
export async function evaluateWorkflowTriggers(
	workflow: Workflow,
	context: TriggerContext,
): Promise<EvaluationResult> {
	const enabledTriggers = workflow.triggers.filter((t) => t.enabled !== false);

	if (enabledTriggers.length === 0) {
		return {
			workflowId: workflow._id,
			triggered: false,
			triggers: [],
			timestamp: Date.now(),
		};
	}

	// Evaluate all triggers
	const triggerResults = await Promise.all(
		enabledTriggers.map((trigger) => evaluateTrigger(trigger, context)),
	);

	// Workflow triggers if ANY trigger condition is met
	const anyTriggered = triggerResults.some((r) => r.triggered);

	return {
		workflowId: workflow._id,
		triggered: anyTriggered,
		triggers: triggerResults,
		timestamp: Date.now(),
	};
}

/**
 * Evaluate multiple workflows
 */
export async function evaluateWorkflows(
	workflows: Workflow[],
	context: TriggerContext,
): Promise<EvaluationResult[]> {
	const results = await Promise.all(
		workflows.map((workflow) => evaluateWorkflowTriggers(workflow, context)),
	);

	return results;
}

/**
 * Get triggered workflows only
 */
export async function getTriggeredWorkflows(
	workflows: Workflow[],
	context: TriggerContext,
): Promise<{ workflow: Workflow; results: EvaluationResult }[]> {
	const results = await evaluateWorkflows(workflows, context);

	return results
		.filter((r) => r.triggered)
		.map((result) => {
			const workflow = workflows.find((w) => w._id === result.workflowId);
			if (!workflow) {
				throw new Error(`Workflow ${result.workflowId} not found`);
			}
			return {
				workflow,
				results: result,
			};
		});
}

/**
 * Build trigger context from X data
 */
export function buildTriggerContext(
	userId: string,
	xUserId: string,
	data: {
		mentions?: unknown[];
		replies?: unknown[];
		retweets?: unknown[];
		posts?: unknown[];
		followers?: unknown[];
		dms?: unknown[];
		lastPostTime?: number;
		links?: unknown[];
		manualTrigger?: boolean;
	},
): TriggerContext {
	return {
		userId,
		xUserId,
		currentTime: Date.now(),
		mentions: (data.mentions || []) as MentionData[],
		replies: (data.replies || []) as ReplyData[],
		retweets: (data.retweets || []) as RetweetData[],
		posts: (data.posts || []) as PostData[],
		followers: (data.followers || []) as FollowerData[],
		dms: (data.dms || []) as DMData[],
		lastPostTime: data.lastPostTime,
		links: (data.links || []) as LinkData[],
		manualTrigger: data.manualTrigger || false,
	};
}

/**
 * Format trigger data for action execution
 */
export function formatTriggerData(
	results: EvaluationResult,
): Record<string, unknown> {
	const triggeredResults = results.triggers.filter((t) => t.triggered);

	if (triggeredResults.length === 0) {
		return {};
	}

	// Use the first triggered trigger's data
	const primaryTrigger = triggeredResults[0];

	return {
		triggerType: primaryTrigger.triggerType,
		triggerTimestamp: primaryTrigger.timestamp,
		...primaryTrigger.data,
	};
}
