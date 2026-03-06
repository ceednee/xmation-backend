// Action execution result
export interface ActionResult {
  success: boolean;
  actionType: string;
  output?: Record<string, any>;
  error?: string;
  executionTimeMs: number;
}

// Action executor function type
export type ActionExecutor = (
  config: Record<string, any>,
  context: ActionContext
) => Promise<ActionResult> | ActionResult;

// Context passed to action executors
export interface ActionContext {
  userId: string;
  xUserId?: string;
  workflowId: string;
  runId: string;
  triggerData: Record<string, any>;
  previousResults?: ActionResult[];
  dryRun: boolean;
}

// Action definition
export interface ActionDefinition {
  type: string;
  name: string;
  description: string;
  executor: ActionExecutor;
  defaultConfig?: Record<string, any>;
  requiredConfig?: string[];
}

// X API Client interface (to be implemented)
export interface XApiClient {
  replyToTweet: (tweetId: string, text: string) => Promise<any>;
  retweet: (tweetId: string) => Promise<any>;
  quoteTweet: (tweetId: string, comment: string) => Promise<any>;
  sendDM: (userId: string, text: string) => Promise<any>;
  followUser: (userId: string) => Promise<any>;
  pinTweet: (tweetId: string) => Promise<any>;
  addToList: (listId: string, userId: string) => Promise<any>;
  blockUser: (userId: string) => Promise<any>;
  reportSpam: (userId: string, reason: string) => Promise<any>;
}
