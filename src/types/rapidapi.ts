// RapidAPI X Data Types - Selected Properties Only
// Based on docs/RAPIDAPI_PROPERTY_SELECTION.md

// User Profile (from user-timeline.json)
export interface XUser {
  restId: string;                    // data.user.result.rest_id
  screenName: string;                // data.user.result.legacy.screen_name
  name: string;                      // data.user.result.legacy.name
  followersCount: number;            // data.user.result.legacy.followers_count
  followingCount: number;            // data.user.result.legacy.following_count
  statusesCount: number;             // data.user.result.legacy.statuses_count
  createdAt: string;                 // data.user.result.legacy.created_at
  verified: boolean;                 // data.user.result.legacy.verified
  pinnedTweetIds: string[];          // data.user.result.legacy.pinned_tweet_ids_str
  profileImageUrl: string;           // data.user.result.legacy.profile_image_url_https
  description: string;               // data.user.result.legacy.description
  url?: string;                      // data.user.result.legacy.url
}

// Tweet (from tweet-detail.json)
export interface XTweet {
  restId: string;                    // data.tweetResult.rest_id
  createdAt: string;                 // data.tweetResult.legacy.created_at
  text: string;                      // data.tweetResult.legacy.text
  authorId: string;                  // data.tweetResult.core.user_results.result.rest_id
  authorScreenName: string;          // data.tweetResult.core.user_results.result.legacy.screen_name
  inReplyToStatusId?: string;        // data.tweetResult.legacy.in_reply_to_status_id_str
  inReplyToUserId?: string;          // data.tweetResult.legacy.in_reply_to_user_id_str
  retweetCount: number;              // data.tweetResult.legacy.retweet_count
  favoriteCount: number;             // data.tweetResult.legacy.favorite_count
  replyCount: number;                // data.tweetResult.legacy.reply_count
  quoteCount: number;                // data.tweetResult.legacy.quote_count
  conversationId: string;            // data.tweetResult.legacy.conversation_id_str
  lang: string;                      // data.tweetResult.legacy.lang
  views?: string;                    // data.tweetResult.views.count
  hashtags: string[];                // data.tweetResult.legacy.entities.hashtags[].text
  mentions: XUserMention[];          // data.tweetResult.legacy.entities.user_mentions[]
  urls: XUrlEntity[];                // data.tweetResult.legacy.entities.urls[]
}

// Mention Entity
export interface XUserMention {
  screenName: string;
  name: string;
  id: string;
  indices: number[];
}

// URL Entity
export interface XUrlEntity {
  url: string;
  expandedUrl: string;
  displayUrl: string;
  indices: number[];
}

// Mention (from mentions.json - same as tweet but with mention context)
export interface XMention extends XTweet {
  // Same as XTweet, but specifically for @mentions
}

// Follower (from followers.json)
export interface XFollower {
  restId: string;                    // data.user.result.timeline...user_results.result.rest_id
  screenName: string;                // data.user.result.timeline...user_results.result.legacy.screen_name
  name: string;                      // data.user.result.timeline...user_results.result.legacy.name
  followersCount: number;            // data.user.result.timeline...user_results.result.legacy.followers_count
  verified: boolean;                 // data.user.result.timeline...user_results.result.legacy.verified
  createdAt: string;                 // data.user.result.timeline...user_results.result.legacy.created_at
  followedBy: boolean;               // data.user.result.timeline...user_results.result.followed_by
  following: boolean;                // data.user.result.timeline...user_results.result.following
}

// Retweet Info (from retweets.json)
export interface XRetweet {
  tweetId: string;                   // data.source_tweet.id
  retweeterId: string;               // data.retweeters_timeline...user_results.result.rest_id
  retweeterScreenName: string;       // data.retweeters_timeline...user_results.result.legacy.screen_name
  retweeterFollowersCount: number;   // data.retweeters_timeline...user_results.result.legacy.followers_count
  totalRetweets: number;             // data.source_tweet.legacy.retweet_count
}

// Direct Message (simplified structure)
export interface XDirectMessage {
  id: string;
  text: string;
  senderId: string;
  senderScreenName: string;
  recipientId: string;
  createdAt: string;
}

// Sync Data Cache Structure
export interface SyncedData {
  user: XUser;
  mentions: XMention[];
  replies: XTweet[];
  retweets: XRetweet[];
  followers: XFollower[];
  lastSyncAt: number;
}

// Trigger Data Context (derived from synced data)
export interface TriggerDataContext {
  userId: string;
  xUserId: string;
  mentions: XMention[];
  replies: XTweet[];
  retweets: XRetweet[];
  posts: XTweet[];
  followers: XFollower[];
  lastPostTime?: number;
  currentTime: number;
}

// Engagement Metrics
export interface EngagementMetrics {
  likes: number;
  replies: number;
  retweets: number;
  quotes: number;
  total: number;
  views?: number;
}

// API Response Types
export interface RapidApiUserResponse {
  data: {
    user: {
      result: {
        rest_id: string;
        legacy: {
          screen_name: string;
          name: string;
          followers_count: number;
          following_count: number;
          statuses_count: number;
          created_at: string;
          verified: boolean;
          pinned_tweet_ids_str?: string[];
          profile_image_url_https: string;
          description: string;
          url?: string;
        };
      };
    };
  };
}

export interface RapidApiTweetResponse {
  data: {
    tweetResult: {
      rest_id: string;
      legacy: {
        created_at: string;
        text: string;
        in_reply_to_status_id_str?: string;
        in_reply_to_user_id_str?: string;
        retweet_count: number;
        favorite_count: number;
        reply_count: number;
        quote_count: number;
        conversation_id_str: string;
        lang: string;
        entities: {
          hashtags: Array<{ text: string }>;
          user_mentions: Array<{
            screen_name: string;
            name: string;
            id_str: string;
            indices: number[];
          }>;
          urls: Array<{
            url: string;
            expanded_url: string;
            display_url: string;
            indices: number[];
          }>;
        };
      };
      core: {
        user_results: {
          result: {
            rest_id: string;
            legacy: {
              screen_name: string;
            };
          };
        };
      };
      views?: {
        count: string;
      };
    };
  };
}

export interface RapidApiMentionsResponse {
  data: {
    timeline: {
      instructions: Array<{
        type: string;
        entries?: Array<{
          entryId: string;
          content: {
            itemContent: {
              tweet_results?: {
                result: RapidApiTweetResponse["data"]["tweetResult"] & {
                  core: {
                    user_results: {
                      result: {
                        rest_id: string;
                        legacy: {
                          screen_name: string;
                          name: string;
                          followers_count: number;
                          verified: boolean;
                          profile_image_url_https: string;
                        };
                      };
                    };
                  };
                };
              };
            };
          };
        }>;
      }>;
    };
  };
}

export interface RapidApiFollowersResponse {
  data: {
    user: {
      result: {
        timeline: {
          timeline: {
            instructions: Array<{
              type: string;
              entries?: Array<{
                content: {
                  itemContent: {
                    user_results: {
                      result: {
                        rest_id: string;
                        legacy: {
                          screen_name: string;
                          name: string;
                          followers_count: number;
                          verified: boolean;
                          created_at: string;
                          profile_image_url_https: string;
                        };
                        followed_by: boolean;
                        following: boolean;
                      };
                    };
                  };
                };
              }>;
            }>;
          };
        };
      };
    };
  };
}

export interface RapidApiRetweetsResponse {
  data: {
    retweeters_timeline: {
      timeline: {
        instructions: Array<{
          type: string;
          entries?: Array<{
            content: {
              itemContent: {
                user_results: {
                  result: {
                    rest_id: string;
                    legacy: {
                      screen_name: string;
                      followers_count: number;
                    };
                  };
                };
              };
            };
          }>;
        }>;
      };
    };
    source_tweet?: {
      legacy: {
        retweet_count: number;
      };
    };
  };
}
