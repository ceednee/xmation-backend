/**
 * Trigger Engine Service
 * 
 * Core service for evaluating workflow triggers against incoming X (Twitter) data.
 * Determines which workflows should execute based on trigger conditions.
 * 
 * ## Key Concepts
 * 
 * - **Trigger Evaluation**: Checks if trigger conditions match incoming data
 * - **OR Logic**: Workflows trigger if ANY of their triggers match (not all)
 * - **Context Building**: Creates trigger context from X API data
 * - **Data Formatting**: Transforms trigger results for action execution
 * 
 * ## Evaluation Flow
 * 
 * ```
 * X Data → Build Context → Evaluate Triggers → Return Results
 *                ↓
 *         For each workflow:
 *           - Check enabled triggers
 *           - Evaluate each trigger
 *           - Return triggered if any match
 * ```
 * 
 * ## Usage
 * 
 * ```typescript
 * // Build context from X data
 * const context = buildTriggerContext(userId, xUserId, {
 *   mentions: newMentions,
 *   followers: newFollowers,
 *   posts: recentPosts,
 * });
 * 
 * // Evaluate single trigger
 * const result = await evaluateTrigger(triggerConfig, context);
 * 
 * // Evaluate all triggers for a workflow
 * const workflowResult = await evaluateWorkflowTriggers(workflow, context);
 * 
 * // Evaluate multiple workflows
 * const results = await evaluateWorkflows(workflows, context);
 * 
 * // Get only triggered workflows
 * const triggered = await getTriggeredWorkflows(workflows, context);
 * 
 * // Format data for actions
 * const actionData = formatTriggerData(workflowResult);
 * ```
 */

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

/**
 * Result of evaluating all triggers for a workflow
 */
export interface EvaluationResult {
	workflowId: string;
	triggered: boolean;
	triggers: TriggerResult[];
	timestamp: number;
}

/**
 * Evaluate a single trigger against the trigger context
 * 
 * @param trigger - Trigger configuration to evaluate
 * @param context - Trigger context with X data
 * @returns Trigger result indicating if conditions were met
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
 * Evaluate all enabled triggers for a workflow
 * Workflow triggers if ANY of its triggers match (OR logic)
 * 
 * @param workflow - Workflow to evaluate
 * @param context - Trigger context with X data
 * @returns Evaluation result with all trigger results
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
 * Evaluate multiple workflows against the same context
 * 
 * @param workflows - Array of workflows to evaluate
 * @param context - Trigger context with X data
 * @returns Array of evaluation results
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
 * Get only the workflows that triggered
 * 
 * @param workflows - Array of workflows to evaluate
 * @param context - Trigger context with X data
 * @returns Array of triggered workflows with their results
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
 * Build trigger context from X API data
 * 
 * @param userId - Internal user ID
 * @param xUserId - X (Twitter) user ID
 * @param data - X data including mentions, followers, posts, etc.
 * @returns Trigger context for evaluation
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
 * Extracts relevant data from the primary triggered trigger
 * 
 * @param results - Workflow evaluation results
 * @returns Formatted data for action context
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
