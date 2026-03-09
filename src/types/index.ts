/**
 * Core Type Definitions
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the Xmation Backend API. These types ensure type safety across workflows,
 * triggers, actions, and user data.
 */

/**
 * Base user account information
 * @property _id - Unique identifier assigned by Convex
 * @property email - User's email address (primary identifier)
 * @property createdAt - Unix timestamp when account was created
 * @property updatedAt - Unix timestamp of last account update
 */
export interface User {
	_id: string;
	email: string;
	createdAt: number;
	updatedAt: number;
}

/**
 * X (Twitter) connected account details
 * Stores OAuth tokens and X profile information for users who connected their X account
 * 
 * @property xAccessToken - Encrypted OAuth access token for X API
 * @property xRefreshToken - Encrypted OAuth refresh token
 * @property xTokenExpiresAt - Unix timestamp when token expires
 * @property xScopes - Granted OAuth scopes (e.g., ['tweet.read', 'tweet.write'])
 * @property profile - Cached X profile information
 * @property preferences - User-specific preferences for X automation
 */
export interface UserX {
	_id: string;
	userId: string;
	xUserId: string;
	xUsername: string;
	xAccessToken: string; // Encrypted
	xRefreshToken: string; // Encrypted
	xTokenExpiresAt: number;
	xScopes: string[];
	profile: XProfile;
	preferences: UserPreferences;
	xConnectedAt: number;
	lastTokenRefresh: number;
}

/**
 * X profile metadata
 * Cached from X API to avoid repeated API calls
 */
export interface XProfile {
	displayName: string;
	avatarUrl: string;
	bio: string;
	followersCount: number;
	followingCount: number;
	verified: boolean;
}

/**
 * User automation preferences
 */
export interface UserPreferences {
	timezone: string;
	dryRunDefault: boolean;
	notificationsEnabled: boolean;
}

/**
 * Workflow lifecycle states
 * - draft: Created but not yet activated
 * - active: Running and processing triggers
 * - paused: Was active but temporarily stopped
 */
export type WorkflowStatus = "draft" | "active" | "paused";

/**
 * Workflow execution mode
 * - live: Execute real actions on X
 * - dry_run: Simulate actions without affecting X (safe testing)
 */
export type WorkflowMode = "live" | "dry_run";

/**
 * Workflow definition
 * A workflow connects triggers (when) to actions (what) in an automation
 * 
 * @example
 * ```typescript
 * const workflow: Workflow = {
 *   _id: "wf_123",
 *   userId: "user_456",
 *   name: "Auto-reply to mentions",
 *   status: "active",
 *   triggers: [{ type: "NEW_MENTION", config: {}, enabled: true }],
 *   actions: [{ type: "REPLY_TO_TWEET", config: { text: "Thanks!" } }],
 *   // ... timestamps
 * }
 * ```
 */
export interface Workflow {
	_id: string;
	userId: string;
	name: string;
	description: string;
	status: WorkflowStatus;
	currentVersionId: string;
	isDryRun: boolean;
	triggers: TriggerConfig[];
	actions: ActionConfig[];
	createdAt: number;
	updatedAt: number;
}

/**
 * Trigger configuration
 * Defines when a workflow should run
 * 
 * @property type - The trigger type (e.g., "NEW_MENTION")
 * @property config - Trigger-specific configuration
 * @property enabled - Whether this trigger is active
 */
export interface TriggerConfig {
	id: string;
	type: TriggerType;
	config: Record<string, unknown>;
	enabled: boolean;
}

/**
 * Action configuration
 * Defines what to do when triggers fire
 * 
 * @property type - The action type (e.g., "REPLY_TO_TWEET")
 * @property config - Action-specific configuration
 * @property delay - Optional delay in milliseconds before executing
 * @property condition - Optional condition that must be met to execute
 */
export interface ActionConfig {
	id: string;
	type: ActionType;
	config: Record<string, unknown>;
	delay?: number; // Milliseconds to wait before executing
	condition?: ConditionConfig;
}

/**
 * Conditional logic for actions
 * Actions only execute if all conditions are met
 */
export interface ConditionConfig {
	operator: "and" | "or" | "not";
	conditions: Array<{
		field: string;
		operator: "eq" | "ne" | "gt" | "lt" | "contains";
		value: unknown;
	}>;
}

/**
 * Available trigger types
 * These represent events that can trigger a workflow
 * 
 * - NEW_MENTION: Someone mentions your account in a tweet
 * - NEW_FOLLOWER: Someone follows your account
 * - NEW_REPLY: Someone replies to your tweet
 * - POST_REPOSTED: Someone retweets your post
 * - HIGH_ENGAGEMENT: Your post exceeds engagement threshold
 * - CONTENT_GAP: You haven't posted in X hours
 * - OPTIMAL_POST_TIME: Current time is optimal for posting
 * - UNFOLLOW_DETECTED: Someone unfollowed your account
 * - NEW_DM: You received a direct message
 * - MANUAL_TRIGGER: User manually triggered the workflow
 * - NEGATIVE_SENTIMENT: Negative sentiment detected in mentions
 * - LINK_BROKEN: A link in your bio or tweets is broken
 */
export type TriggerType =
	| "NEW_MENTION"
	| "NEW_FOLLOWER"
	| "NEW_REPLY"
	| "POST_REPOSTED"
	| "HIGH_ENGAGEMENT"
	| "CONTENT_GAP"
	| "OPTIMAL_POST_TIME"
	| "UNFOLLOW_DETECTED"
	| "NEW_DM"
	| "MANUAL_TRIGGER"
	| "NEGATIVE_SENTIMENT"
	| "LINK_BROKEN";

/**
 * Available action types
 * These represent operations that can be performed
 * 
 * X API Actions:
 * - REPLY_TO_TWEET: Reply to a specific tweet
 * - RETWEET: Retweet a tweet
 * - QUOTE_TWEET: Quote tweet with a comment
 * - SEND_DM: Send a direct message
 * - FOLLOW_USER: Follow a user
 * - FOLLOW_BACK: Follow back a new follower
 * - WELCOME_DM: Send welcome DM to new follower
 * - PIN_TWEET: Pin a tweet to profile
 * - ADD_TO_LIST: Add user to a list
 * - BLOCK_USER: Block a user
 * - REPORT_SPAM: Report a user as spam
 * - THANK_YOU_REPLY: Send thank you reply to engagement
 * 
 * Internal Actions:
 * - WAIT_DELAY: Pause for specified time
 * - CONDITION_CHECK: Evaluate if/then condition
 * - LOG_EVENT: Log analytics event
 * - ALERT_ADMIN: Send security alert
 */
export type ActionType =
	| "REPLY_TO_TWEET"
	| "RETWEET"
	| "QUOTE_TWEET"
	| "SEND_DM"
	| "FOLLOW_USER"
	| "FOLLOW_BACK"
	| "WELCOME_DM"
	| "PIN_TWEET"
	| "WAIT_DELAY"
	| "CONDITION_CHECK"
	| "LOG_EVENT"
	| "THANK_YOU_REPLY"
	| "ADD_TO_LIST"
	| "BLOCK_USER"
	| "REPORT_SPAM"
	| "ALERT_ADMIN";

/**
 * Workflow execution status
 */
export type RunStatus = "running" | "completed" | "failed" | "cancelled";

/**
 * A single workflow execution instance
 * Tracks the state of a workflow run from trigger to completion
 */
export interface WorkflowRun {
	_id: string;
	workflowId: string;
	userId: string;
	status: RunStatus;
	mode: WorkflowMode;
	triggerData: Record<string, unknown>;
	actionsExecuted: ActionExecution[];
	startedAt: number;
	completedAt?: number;
	error?: string;
}

/**
 * Individual action execution within a workflow run
 */
export interface ActionExecution {
	actionId: string;
	actionType: ActionType;
	status: "pending" | "running" | "completed" | "failed";
	input: Record<string, unknown>;
	output?: Record<string, unknown>;
	error?: string;
	startedAt: number;
	completedAt?: number;
}

/**
 * Analytics event for tracking and monitoring
 */
export interface AnalyticsEvent {
	_id: string;
	userId: string;
	eventType: string;
	workflowId?: string;
	runId?: string;
	metadata: Record<string, unknown>;
	timestamp: number;
}

/**
 * Standard API response wrapper
 * All API endpoints return this structure
 * 
 * @example Success
 * ```json
 * { "success": true, "data": { "id": "wf_123" } }
 * ```
 * 
 * @example Error
 * ```json
 * { "success": false, "error": { "code": "NOT_FOUND", "message": "Workflow not found" } }
 * ```
 */
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
	meta?: {
		page?: number;
		limit?: number;
		total?: number;
	};
}
