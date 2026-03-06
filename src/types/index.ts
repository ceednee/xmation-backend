// User types
export interface User {
  _id: string;
  email: string;
  createdAt: number;
  updatedAt: number;
}

// X-connected user
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

export interface XProfile {
  displayName: string;
  avatarUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  verified: boolean;
}

export interface UserPreferences {
  timezone: string;
  dryRunDefault: boolean;
  notificationsEnabled: boolean;
}

// Workflow types
export type WorkflowStatus = "draft" | "active" | "paused";
export type WorkflowMode = "live" | "dry_run";

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

export interface TriggerConfig {
  id: string;
  type: TriggerType;
  config: Record<string, any>;
  enabled: boolean;
}

export interface ActionConfig {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  delay?: number; // Milliseconds to wait before executing
  condition?: ConditionConfig;
}

export interface ConditionConfig {
  operator: "and" | "or" | "not";
  conditions: Array<{
    field: string;
    operator: "eq" | "ne" | "gt" | "lt" | "contains";
    value: any;
  }>;
}

// Trigger types (user's selected 11)
export type TriggerType =
  | "NEW_MENTION"
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

// Action types (user's selected 15)
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

// Workflow run
export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export interface WorkflowRun {
  _id: string;
  workflowId: string;
  userId: string;
  status: RunStatus;
  mode: WorkflowMode;
  triggerData: Record<string, any>;
  actionsExecuted: ActionExecution[];
  startedAt: number;
  completedAt?: number;
  error?: string;
}

export interface ActionExecution {
  actionId: string;
  actionType: ActionType;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

// Analytics
export interface AnalyticsEvent {
  _id: string;
  userId: string;
  eventType: string;
  workflowId?: string;
  runId?: string;
  metadata: Record<string, any>;
  timestamp: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
