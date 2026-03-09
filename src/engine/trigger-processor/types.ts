/**
 * Trigger Processor Types
 * 
 * Defines types for trigger evaluation and workflow queueing.
 * The trigger processor evaluates triggers and queues workflows
 * for execution when conditions are met.
 */

import type { Workflow } from "../../types";
import type { TriggerContext } from "../../triggers/types";

/**
 * Workflow queued for execution after trigger evaluation
 * 
 * @property workflow - The workflow to execute
 * @property context - Trigger context data
 * @property triggerType - Type of trigger that fired
 * @property triggerData - Specific data about the trigger event
 * @property enqueuedAt - Unix timestamp when queued
 */
export interface QueuedWorkflow {
	workflow: Workflow;
	context: TriggerContext;
	triggerType: string;
	triggerData: unknown;
	enqueuedAt: number;
	/**
	 * @deprecated Use enqueuedAt instead
	 */
	queuedAt?: number;
}

/**
 * Result of trigger evaluation
 * 
 * @property shouldTrigger - Whether the workflow should be triggered
 * @property triggerType - The trigger type that matched (if multiple)
 * @property data - Additional data about the trigger event
 */
export interface EvaluationResult {
	shouldTrigger: boolean;
	triggerType?: string;
	data?: Record<string, unknown>;
}
