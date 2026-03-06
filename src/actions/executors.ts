import type { ActionExecutor, ActionResult, ActionContext, ActionDefinition, XApiClient } from "./types";

// Helper to create result
const createResult = (
  success: boolean,
  actionType: string,
  executionTimeMs: number,
  output?: Record<string, any>,
  error?: string
): ActionResult => ({
  success,
  actionType,
  output,
  error,
  executionTimeMs,
});

// Helper to replace template variables
const replaceTemplates = (text: string, context: ActionContext): string => {
  return text.replace(/{{(\w+)}}/g, (match, key) => {
    // Check trigger data first
    if (context.triggerData[key] !== undefined) {
      return String(context.triggerData[key]);
    }
    // Check trigger data nested (e.g., authorUsername)
    if (context.triggerData.authorUsername && key === "authorUsername") {
      return context.triggerData.authorUsername;
    }
    if (context.triggerData.followerUsername && key === "followerUsername") {
      return context.triggerData.followerUsername;
    }
    return match;
  });
};

// Mock X API client (replace with real implementation)
const createXClient = (context: ActionContext): XApiClient => {
  return {
    replyToTweet: async (tweetId: string, text: string) => {
      if (context.dryRun) {
        return { id: "mock_reply_id", text, tweetId };
      }
      // Real API call here
      return { id: `reply_${Date.now()}`, text, tweetId };
    },
    retweet: async (tweetId: string) => {
      if (context.dryRun) {
        return { id: "mock_retweet_id", tweetId };
      }
      return { id: `retweet_${Date.now()}`, tweetId };
    },
    quoteTweet: async (tweetId: string, comment: string) => {
      if (context.dryRun) {
        return { id: "mock_quote_id", comment, tweetId };
      }
      return { id: `quote_${Date.now()}`, comment, tweetId };
    },
    sendDM: async (userId: string, text: string) => {
      if (context.dryRun) {
        return { id: "mock_dm_id", text, recipientId: userId };
      }
      return { id: `dm_${Date.now()}`, text, recipientId: userId };
    },
    followUser: async (userId: string) => {
      if (context.dryRun) {
        return { following: true, userId };
      }
      return { following: true, userId };
    },
    pinTweet: async (tweetId: string) => {
      if (context.dryRun) {
        return { pinned: true, tweetId };
      }
      return { pinned: true, tweetId };
    },
    addToList: async (listId: string, userId: string) => {
      if (context.dryRun) {
        return { added: true, listId, userId };
      }
      return { added: true, listId, userId };
    },
    blockUser: async (userId: string) => {
      if (context.dryRun) {
        return { blocked: true, userId };
      }
      return { blocked: true, userId };
    },
    reportSpam: async (userId: string, reason: string) => {
      if (context.dryRun) {
        return { reported: true, userId, reason };
      }
      return { reported: true, userId, reason };
    },
  };
};

// 1. REPLY_TO_TWEET - Reply to a tweet
export const replyToTweetExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const text = replaceTemplates(config.text, context);
    const tweetId = config.tweetId || context.triggerData.tweetId || context.triggerData.mentionId;

    if (!tweetId) {
      return createResult(false, "REPLY_TO_TWEET", Date.now() - start, undefined, "No tweet ID provided");
    }

    const result = await xClient.replyToTweet(tweetId, text);

    return createResult(
      true,
      "REPLY_TO_TWEET",
      Date.now() - start,
      { tweetId: result.id, text, repliedTo: tweetId }
    );
  } catch (error) {
    return createResult(
      false,
      "REPLY_TO_TWEET",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to reply"
    );
  }
};

// 2. RETWEET - Retweet a tweet
export const retweetExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const tweetId = config.tweetId || context.triggerData.tweetId || context.triggerData.retweetId;

    if (!tweetId) {
      return createResult(false, "RETWEET", Date.now() - start, undefined, "No tweet ID provided");
    }

    const result = await xClient.retweet(tweetId);

    return createResult(
      true,
      "RETWEET",
      Date.now() - start,
      { retweetId: result.id, originalTweetId: tweetId }
    );
  } catch (error) {
    return createResult(
      false,
      "RETWEET",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to retweet"
    );
  }
};

// 3. QUOTE_TWEET - Quote tweet with comment
export const quoteTweetExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const comment = replaceTemplates(config.comment, context);
    const tweetId = config.tweetId || context.triggerData.tweetId;

    if (!tweetId) {
      return createResult(false, "QUOTE_TWEET", Date.now() - start, undefined, "No tweet ID provided");
    }

    const result = await xClient.quoteTweet(tweetId, comment);

    return createResult(
      true,
      "QUOTE_TWEET",
      Date.now() - start,
      { quoteId: result.id, comment, originalTweetId: tweetId }
    );
  } catch (error) {
    return createResult(
      false,
      "QUOTE_TWEET",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to quote tweet"
    );
  }
};

// 4. SEND_DM - Send direct message
export const sendDMExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const text = replaceTemplates(config.text, context);
    const userId = config.userId || context.triggerData.authorId || context.triggerData.followerId;

    if (!userId) {
      return createResult(false, "SEND_DM", Date.now() - start, undefined, "No user ID provided");
    }

    const result = await xClient.sendDM(userId, text);

    return createResult(
      true,
      "SEND_DM",
      Date.now() - start,
      { dmId: result.id, text, recipientId: userId }
    );
  } catch (error) {
    return createResult(
      false,
      "SEND_DM",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to send DM"
    );
  }
};

// 5. FOLLOW_USER - Follow a user
export const followUserExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const userId = config.userId || context.triggerData.authorId;

    if (!userId) {
      return createResult(false, "FOLLOW_USER", Date.now() - start, undefined, "No user ID provided");
    }

    const result = await xClient.followUser(userId);

    return createResult(
      true,
      "FOLLOW_USER",
      Date.now() - start,
      { userId, following: result.following }
    );
  } catch (error) {
    return createResult(
      false,
      "FOLLOW_USER",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to follow user"
    );
  }
};

// 6. FOLLOW_BACK - Follow back new follower
export const followBackExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const userId = context.triggerData.followerId;

    if (!userId) {
      return createResult(false, "FOLLOW_BACK", Date.now() - start, undefined, "No follower ID provided");
    }

    const result = await xClient.followUser(userId);

    return createResult(
      true,
      "FOLLOW_BACK",
      Date.now() - start,
      { userId, following: result.following }
    );
  } catch (error) {
    return createResult(
      false,
      "FOLLOW_BACK",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to follow back"
    );
  }
};

// 7. WELCOME_DM - Send welcome DM to new follower
export const welcomeDMExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const message = replaceTemplates(config.message || "Welcome! Thanks for following!", context);
    const userId = context.triggerData.followerId;

    if (!userId) {
      return createResult(false, "WELCOME_DM", Date.now() - start, undefined, "No follower ID provided");
    }

    const result = await xClient.sendDM(userId, message);

    return createResult(
      true,
      "WELCOME_DM",
      Date.now() - start,
      { dmId: result.id, message, recipientId: userId }
    );
  } catch (error) {
    return createResult(
      false,
      "WELCOME_DM",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to send welcome DM"
    );
  }
};

// 8. PIN_TWEET - Pin a tweet to profile
export const pinTweetExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const tweetId = config.tweetId || context.triggerData.tweetId || context.triggerData.topPost?.id;

    if (!tweetId) {
      return createResult(false, "PIN_TWEET", Date.now() - start, undefined, "No tweet ID provided");
    }

    const result = await xClient.pinTweet(tweetId);

    return createResult(
      true,
      "PIN_TWEET",
      Date.now() - start,
      { tweetId, pinned: result.pinned }
    );
  } catch (error) {
    return createResult(
      false,
      "PIN_TWEET",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to pin tweet"
    );
  }
};

// 9. WAIT_DELAY - Wait for specified time
export const waitDelayExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();

  try {
    // Parse delay from config
    let delayMs = config.delayMs || 0;

    if (config.delay) {
      // Parse time string like "5m", "1h"
      const match = config.delay.match(/^(\d+)([smh])$/);
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];
        if (unit === "s") delayMs = value * 1000;
        else if (unit === "m") delayMs = value * 60 * 1000;
        else if (unit === "h") delayMs = value * 60 * 60 * 1000;
      }
    }

    // In dry run, don't actually wait
    if (!context.dryRun && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 5000))); // Max 5s in tests
    }

    return createResult(
      true,
      "WAIT_DELAY",
      Date.now() - start,
      { delayMs, waited: !context.dryRun }
    );
  } catch (error) {
    return createResult(
      false,
      "WAIT_DELAY",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to wait"
    );
  }
};

// 10. CONDITION_CHECK - If/Then/Else logic
export const conditionCheckExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();

  try {
    const { condition, then: thenActions, else: elseActions } = config;

    // Evaluate condition
    let conditionMet = false;
    const fieldValue = context.triggerData[condition.field] || context[condition.field as keyof ActionContext];

    switch (condition.operator) {
      case "eq":
        conditionMet = fieldValue === condition.value;
        break;
      case "ne":
        conditionMet = fieldValue !== condition.value;
        break;
      case "gt":
        conditionMet = fieldValue > condition.value;
        break;
      case "lt":
        conditionMet = fieldValue < condition.value;
        break;
      case "gte":
        conditionMet = fieldValue >= condition.value;
        break;
      case "lte":
        conditionMet = fieldValue <= condition.value;
        break;
      case "contains":
        conditionMet = String(fieldValue).includes(condition.value);
        break;
    }

    return createResult(
      true,
      "CONDITION_CHECK",
      Date.now() - start,
      {
        conditionMet,
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        actualValue: fieldValue,
        thenActions: thenActions?.length || 0,
        elseActions: elseActions?.length || 0,
      }
    );
  } catch (error) {
    return createResult(
      false,
      "CONDITION_CHECK",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to evaluate condition"
    );
  }
};

// 11. LOG_EVENT - Log to analytics
export const logEventExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();

  try {
    const logEntry = {
      timestamp: Date.now(),
      eventType: config.eventType || "action_executed",
      workflowId: context.workflowId,
      runId: context.runId,
      userId: context.userId,
      actionType: config.actionType || "LOG_EVENT",
      metadata: {
        ...config.metadata,
        triggerData: context.triggerData,
      },
    };

    // In real implementation, save to database
    console.log("[LOG_EVENT]", JSON.stringify(logEntry));

    return createResult(
      true,
      "LOG_EVENT",
      Date.now() - start,
      { logged: true, eventType: logEntry.eventType }
    );
  } catch (error) {
    return createResult(
      false,
      "LOG_EVENT",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to log event"
    );
  }
};

// 12. THANK_YOU_REPLY - Auto-thank for engagement
export const thankYouReplyExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const messages = [
      "Thanks!",
      "Thank you!",
      "Appreciate it!",
      "Thanks for the support!",
    ];

    const text = config.text || messages[Math.floor(Math.random() * messages.length)];
    const tweetId = context.triggerData.tweetId || context.triggerData.mentionId;

    if (!tweetId) {
      return createResult(false, "THANK_YOU_REPLY", Date.now() - start, undefined, "No tweet ID provided");
    }

    const result = await xClient.replyToTweet(tweetId, text);

    return createResult(
      true,
      "THANK_YOU_REPLY",
      Date.now() - start,
      { replyId: result.id, text, repliedTo: tweetId }
    );
  } catch (error) {
    return createResult(
      false,
      "THANK_YOU_REPLY",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to send thank you"
    );
  }
};

// 13. ADD_TO_LIST - Add user to X list
export const addToListExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const listId = config.listId;
    const userId = config.userId || context.triggerData.authorId;

    if (!listId) {
      return createResult(false, "ADD_TO_LIST", Date.now() - start, undefined, "No list ID provided");
    }
    if (!userId) {
      return createResult(false, "ADD_TO_LIST", Date.now() - start, undefined, "No user ID provided");
    }

    const result = await xClient.addToList(listId, userId);

    return createResult(
      true,
      "ADD_TO_LIST",
      Date.now() - start,
      { listId, userId, added: result.added }
    );
  } catch (error) {
    return createResult(
      false,
      "ADD_TO_LIST",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to add to list"
    );
  }
};

// 14. BLOCK_USER - Block a user
export const blockUserExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const userId = config.userId || context.triggerData.authorId;

    if (!userId) {
      return createResult(false, "BLOCK_USER", Date.now() - start, undefined, "No user ID provided");
    }

    const result = await xClient.blockUser(userId);

    return createResult(
      true,
      "BLOCK_USER",
      Date.now() - start,
      { userId, blocked: result.blocked }
    );
  } catch (error) {
    return createResult(
      false,
      "BLOCK_USER",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to block user"
    );
  }
};

// 15. REPORT_SPAM - Report spam
export const reportSpamExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();
  const xClient = createXClient(context);

  try {
    const userId = config.userId || context.triggerData.authorId;
    const reason = config.reason || "spam";

    if (!userId) {
      return createResult(false, "REPORT_SPAM", Date.now() - start, undefined, "No user ID provided");
    }

    const result = await xClient.reportSpam(userId, reason);

    return createResult(
      true,
      "REPORT_SPAM",
      Date.now() - start,
      { userId, reason, reported: result.reported }
    );
  } catch (error) {
    return createResult(
      false,
      "REPORT_SPAM",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to report spam"
    );
  }
};

// 16. ALERT_ADMIN - Send security alert
export const alertAdminExecutor: ActionExecutor = async (config, context) => {
  const start = Date.now();

  try {
    const alert = {
      severity: config.severity || "medium",
      message: config.message || "Alert triggered",
      workflowId: context.workflowId,
      runId: context.runId,
      userId: context.userId,
      timestamp: Date.now(),
      triggerData: context.triggerData,
    };

    // In real implementation, send to alerting system (Slack, PagerDuty, etc.)
    console.log("[ADMIN_ALERT]", JSON.stringify(alert));

    return createResult(
      true,
      "ALERT_ADMIN",
      Date.now() - start,
      { alerted: true, severity: alert.severity }
    );
  } catch (error) {
    return createResult(
      false,
      "ALERT_ADMIN",
      Date.now() - start,
      undefined,
      error instanceof Error ? error.message : "Failed to send alert"
    );
  }
};

// Action registry
export const actionRegistry: Map<string, ActionDefinition> = new Map([
  ["REPLY_TO_TWEET", { type: "REPLY_TO_TWEET", name: "Reply to Tweet", description: "Reply to a tweet", executor: replyToTweetExecutor, requiredConfig: ["text"] }],
  ["RETWEET", { type: "RETWEET", name: "Retweet", description: "Retweet a tweet", executor: retweetExecutor }],
  ["QUOTE_TWEET", { type: "QUOTE_TWEET", name: "Quote Tweet", description: "Quote tweet with comment", executor: quoteTweetExecutor, requiredConfig: ["comment"] }],
  ["SEND_DM", { type: "SEND_DM", name: "Send DM", description: "Send direct message", executor: sendDMExecutor, requiredConfig: ["text"] }],
  ["FOLLOW_USER", { type: "FOLLOW_USER", name: "Follow User", description: "Follow a user", executor: followUserExecutor }],
  ["FOLLOW_BACK", { type: "FOLLOW_BACK", name: "Follow Back", description: "Follow back new follower", executor: followBackExecutor }],
  ["WELCOME_DM", { type: "WELCOME_DM", name: "Welcome DM", description: "Send welcome DM to new follower", executor: welcomeDMExecutor, defaultConfig: { message: "Welcome! Thanks for following!" } }],
  ["PIN_TWEET", { type: "PIN_TWEET", name: "Pin Tweet", description: "Pin a tweet to profile", executor: pinTweetExecutor }],
  ["WAIT_DELAY", { type: "WAIT_DELAY", name: "Wait/Delay", description: "Wait for specified time", executor: waitDelayExecutor, defaultConfig: { delayMs: 5000 } }],
  ["CONDITION_CHECK", { type: "CONDITION_CHECK", name: "Condition Check", description: "If/Then/Else logic", executor: conditionCheckExecutor, requiredConfig: ["condition"] }],
  ["LOG_EVENT", { type: "LOG_EVENT", name: "Log Event", description: "Log to analytics", executor: logEventExecutor }],
  ["THANK_YOU_REPLY", { type: "THANK_YOU_REPLY", name: "Thank You Reply", description: "Auto-thank for engagement", executor: thankYouReplyExecutor }],
  ["ADD_TO_LIST", { type: "ADD_TO_LIST", name: "Add to List", description: "Add user to X list", executor: addToListExecutor, requiredConfig: ["listId"] }],
  ["BLOCK_USER", { type: "BLOCK_USER", name: "Block User", description: "Block a user", executor: blockUserExecutor }],
  ["REPORT_SPAM", { type: "REPORT_SPAM", name: "Report Spam", description: "Report user as spam", executor: reportSpamExecutor }],
  ["ALERT_ADMIN", { type: "ALERT_ADMIN", name: "Alert Admin", description: "Send security alert", executor: alertAdminExecutor }],
]);

// Get action definition
export function getActionDefinition(type: string): ActionDefinition | undefined {
  return actionRegistry.get(type);
}

// Get all action definitions
export function getAllActionDefinitions(): ActionDefinition[] {
  return Array.from(actionRegistry.values());
}

// Validate action config
export function validateActionConfig(type: string, config: Record<string, any>): string[] {
  const definition = getActionDefinition(type);
  if (!definition) return ["Unknown action type"];

  const errors: string[] = [];
  for (const required of definition.requiredConfig || []) {
    if (config[required] === undefined) {
      errors.push(`Missing required config: ${required}`);
    }
  }
  return errors;
}
