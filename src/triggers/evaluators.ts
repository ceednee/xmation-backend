import type {
  TriggerEvaluator,
  TriggerResult,
  TriggerContext,
  TriggerDefinition,
} from "./types";

// Helper to create result
const createResult = (
  triggered: boolean,
  triggerType: string,
  data?: Record<string, any>
): TriggerResult => ({
  triggered,
  triggerType,
  data,
  timestamp: Date.now(),
});

// 1. NEW_MENTION - Someone @mentions you
export const newMentionEvaluator: TriggerEvaluator = (config, context) => {
  const mentions = context.mentions || [];
  const newMentions = mentions.filter(
    (m) => m.createdAt > (context.currentTime || Date.now()) - 60000 // Last minute
  );

  if (newMentions.length === 0) {
    return createResult(false, "NEW_MENTION");
  }

  return createResult(true, "NEW_MENTION", {
    mentions: newMentions,
    count: newMentions.length,
    latestMention: newMentions[0],
  });
};

// 2. NEW_REPLY - Someone replies to your tweet
export const newReplyEvaluator: TriggerEvaluator = (config, context) => {
  const replies = context.replies || [];
  const newReplies = replies.filter(
    (r) => r.createdAt > (context.currentTime || Date.now()) - 60000
  );

  if (newReplies.length === 0) {
    return createResult(false, "NEW_REPLY");
  }

  return createResult(true, "NEW_REPLY", {
    replies: newReplies,
    count: newReplies.length,
    latestReply: newReplies[0],
  });
};

// 3. POST_REPOSTED - Someone retweets your post
export const postRepostedEvaluator: TriggerEvaluator = (config, context) => {
  const retweets = context.retweets || [];
  const newRetweets = retweets.filter(
    (r) => r.createdAt > (context.currentTime || Date.now()) - 60000
  );

  if (newRetweets.length === 0) {
    return createResult(false, "POST_REPOSTED");
  }

  return createResult(true, "POST_REPOSTED", {
    retweets: newRetweets,
    count: newRetweets.length,
    latestRetweet: newRetweets[0],
  });
};

// 4. HIGH_ENGAGEMENT - Post gets high engagement
export const highEngagementEvaluator: TriggerEvaluator = (config, context) => {
  const threshold = config.threshold || 100;
  const timeWindow = config.timeWindow || 3600000; // 1 hour default
  const posts = context.posts || [];

  const recentPosts = posts.filter(
    (p) =>
      p.createdAt > (context.currentTime || Date.now()) - timeWindow &&
      p.likes + p.replies + p.retweets > threshold
  );

  if (recentPosts.length === 0) {
    return createResult(false, "HIGH_ENGAGEMENT");
  }

  const topPost = recentPosts.sort(
    (a, b) => b.likes + b.replies + b.retweets - (a.likes + a.replies + a.retweets)
  )[0];

  return createResult(true, "HIGH_ENGAGEMENT", {
    posts: recentPosts,
    topPost,
    engagement: topPost.likes + topPost.replies + topPost.retweets,
    threshold,
  });
};

// 5. CONTENT_GAP - No posts in 24h
export const contentGapEvaluator: TriggerEvaluator = (config, context) => {
  const gapThreshold = config.gapHours || 24;
  const gapMs = gapThreshold * 60 * 60 * 1000;
  const lastPostTime = context.lastPostTime || 0;

  if (lastPostTime === 0) {
    // Never posted
    return createResult(true, "CONTENT_GAP", {
      hoursSinceLastPost: null,
      message: "No posts yet",
    });
  }

  const hoursSinceLastPost =
    ((context.currentTime || Date.now()) - lastPostTime) / (60 * 60 * 1000);

  if (hoursSinceLastPost > gapThreshold) {
    return createResult(true, "CONTENT_GAP", {
      hoursSinceLastPost: Math.floor(hoursSinceLastPost),
      lastPostTime,
    });
  }

  return createResult(false, "CONTENT_GAP");
};

// 6. OPTIMAL_POST_TIME - Best time to post
export const optimalPostTimeEvaluator: TriggerEvaluator = (config, context) => {
  const optimalHours = config.optimalHours || [9, 12, 17]; // 9am, 12pm, 5pm
  const timezone = config.timezone || "UTC";
  const currentTime = context.currentTime || Date.now();
  const now = new Date(currentTime);

  // Convert to user's timezone (simplified - in production use proper timezone handling)
  const currentHour = now.getUTCHours();

  // Check if within optimal window (±30 minutes)
  const isOptimalTime = optimalHours.some((hour: number) => {
    const diff = Math.abs(currentHour - hour);
    return diff <= 0.5 || diff >= 23.5; // Handle wrap-around
  });

  if (!isOptimalTime) {
    return createResult(false, "OPTIMAL_POST_TIME");
  }

  return createResult(true, "OPTIMAL_POST_TIME", {
    currentHour,
    optimalHours,
    timezone,
  });
};

// 7. UNFOLLOW_DETECTED - Someone unfollowed
export const unfollowDetectedEvaluator: TriggerEvaluator = (config, context) => {
  const followers = context.followers || [];
  const unfollows = followers.filter((f) => f.action === "unfollow");

  if (unfollows.length === 0) {
    return createResult(false, "UNFOLLOW_DETECTED");
  }

  return createResult(true, "UNFOLLOW_DETECTED", {
    unfollows,
    count: unfollows.length,
    recentUnfollows: unfollows.slice(0, 10),
  });
};

// 8. NEW_DM - New direct message
export const newDMEvaluator: TriggerEvaluator = (config, context) => {
  const dms = context.dms || [];
  const newDMs = dms.filter(
    (dm) => dm.createdAt > (context.currentTime || Date.now()) - 60000
  );

  if (newDMs.length === 0) {
    return createResult(false, "NEW_DM");
  }

  return createResult(true, "NEW_DM", {
    dms: newDMs,
    count: newDMs.length,
    latestDM: newDMs[0],
  });
};

// 9. MANUAL_TRIGGER - User clicks button
export const manualTriggerEvaluator: TriggerEvaluator = (config, context) => {
  if (!context.manualTrigger) {
    return createResult(false, "MANUAL_TRIGGER");
  }

  return createResult(true, "MANUAL_TRIGGER", {
    triggeredAt: context.currentTime || Date.now(),
    triggeredBy: context.userId,
  });
};

// 10. NEGATIVE_SENTIMENT - Bad sentiment detected
export const negativeSentimentEvaluator: TriggerEvaluator = (
  config,
  context
) => {
  const negativeWords = config.negativeWords || [
    "terrible",
    "awful",
    "bad",
    "hate",
    "worst",
    "suck",
    "disappointing",
    "angry",
    "frustrated",
    "annoying",
  ];

  const mentions = context.mentions || [];
  const negativeMentions = mentions.filter((m) =>
    negativeWords.some((word: string) =>
      m.text.toLowerCase().includes(word.toLowerCase())
    )
  );

  if (negativeMentions.length === 0) {
    return createResult(false, "NEGATIVE_SENTIMENT");
  }

  return createResult(true, "NEGATIVE_SENTIMENT", {
    mentions: negativeMentions,
    count: negativeMentions.length,
    detectedWords: negativeWords.filter((word: string) =>
      negativeMentions.some((m) =>
        m.text.toLowerCase().includes(word.toLowerCase())
      )
    ),
  });
};

// 11. LINK_BROKEN - Bio or post link is broken
export const linkBrokenEvaluator: TriggerEvaluator = (config, context) => {
  const links = context.links || [];
  const brokenLinks = links.filter((link) => link.status >= 400);

  if (brokenLinks.length === 0) {
    return createResult(false, "LINK_BROKEN");
  }

  return createResult(true, "LINK_BROKEN", {
    brokenLinks,
    count: brokenLinks.length,
    locations: brokenLinks.map((l) => l.location),
  });
};

// Trigger registry
export const triggerRegistry: Map<string, TriggerDefinition> = new Map([
  [
    "NEW_MENTION",
    {
      type: "NEW_MENTION",
      name: "New Mention",
      description: "Triggered when someone @mentions you",
      evaluator: newMentionEvaluator,
    },
  ],
  [
    "NEW_REPLY",
    {
      type: "NEW_REPLY",
      name: "New Reply",
      description: "Triggered when someone replies to your tweet",
      evaluator: newReplyEvaluator,
    },
  ],
  [
    "POST_REPOSTED",
    {
      type: "POST_REPOSTED",
      name: "Post Reposted",
      description: "Triggered when someone retweets your post",
      evaluator: postRepostedEvaluator,
    },
  ],
  [
    "HIGH_ENGAGEMENT",
    {
      type: "HIGH_ENGAGEMENT",
      name: "High Engagement",
      description: "Triggered when post engagement exceeds threshold",
      evaluator: highEngagementEvaluator,
      defaultConfig: { threshold: 100, timeWindow: 3600000 },
    },
  ],
  [
    "CONTENT_GAP",
    {
      type: "CONTENT_GAP",
      name: "Content Gap",
      description: "Triggered when no posts in specified hours",
      evaluator: contentGapEvaluator,
      defaultConfig: { gapHours: 24 },
    },
  ],
  [
    "OPTIMAL_POST_TIME",
    {
      type: "OPTIMAL_POST_TIME",
      name: "Optimal Post Time",
      description: "Triggered at optimal posting times",
      evaluator: optimalPostTimeEvaluator,
      defaultConfig: { optimalHours: [9, 12, 17], timezone: "UTC" },
    },
  ],
  [
    "UNFOLLOW_DETECTED",
    {
      type: "UNFOLLOW_DETECTED",
      name: "Unfollow Detected",
      description: "Triggered when someone unfollows you",
      evaluator: unfollowDetectedEvaluator,
    },
  ],
  [
    "NEW_DM",
    {
      type: "NEW_DM",
      name: "New DM",
      description: "Triggered when you receive a direct message",
      evaluator: newDMEvaluator,
    },
  ],
  [
    "MANUAL_TRIGGER",
    {
      type: "MANUAL_TRIGGER",
      name: "Manual Trigger",
      description: "Triggered when user clicks button",
      evaluator: manualTriggerEvaluator,
    },
  ],
  [
    "NEGATIVE_SENTIMENT",
    {
      type: "NEGATIVE_SENTIMENT",
      name: "Negative Sentiment",
      description: "Triggered when negative sentiment detected",
      evaluator: negativeSentimentEvaluator,
      defaultConfig: {
        negativeWords: [
          "terrible",
          "awful",
          "bad",
          "hate",
          "worst",
          "suck",
          "disappointing",
        ],
      },
    },
  ],
  [
    "LINK_BROKEN",
    {
      type: "LINK_BROKEN",
      name: "Link Broken",
      description: "Triggered when a bio or post link is broken",
      evaluator: linkBrokenEvaluator,
    },
  ],
]);

// Get trigger definition
export function getTriggerDefinition(type: string): TriggerDefinition | undefined {
  return triggerRegistry.get(type);
}

// Get all trigger definitions
export function getAllTriggerDefinitions(): TriggerDefinition[] {
  return Array.from(triggerRegistry.values());
}
