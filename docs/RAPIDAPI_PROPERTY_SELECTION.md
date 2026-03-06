# RapidAPI Property Selection Analysis

> **CRITICAL DOCUMENT**: This defines which properties from RapidAPI X endpoints are used for triggers and actions.

---

## Executive Summary

Based on analysis of the JSON response structures, I've identified the **essential properties** needed for our 11 triggers and 16 actions. This document serves as the **single source of truth** for data mapping.

---

## Selected Properties by Endpoint

### 1. User Timeline Endpoint (`user-timeline.json`)

**Selected Properties:**

| Property Path | Type | Used For | Triggers/Actions |
|--------------|------|----------|-----------------|
| `data.user.result.rest_id` | string | X User ID | All auth operations |
| `data.user.result.legacy.screen_name` | string | Username | REPLY_TO_TWEET, SEND_DM |
| `data.user.result.legacy.name` | string | Display name | WELCOME_DM templates |
| `data.user.result.legacy.followers_count` | number | Follower count | UNFOLLOW_DETECTED, FOLLOWER_MILESTONE |
| `data.user.result.legacy.following_count` | number | Following count | FOLLOW_USER validation |
| `data.user.result.legacy.statuses_count` | number | Post count | CONTENT_GAP calculation |
| `data.user.result.legacy.created_at` | string | Account age | High-value follower detection |
| `data.user.result.legacy.verified` | boolean | Verified status | HIGH_VALUE_FOLLOWER (future) |
| `data.user.result.legacy.pinned_tweet_ids` | array[] | Pinned tweets | PIN_TWEET replacement |
| `data.user.result.legacy.profile_image_url_https` | string | Avatar URL | Profile display |
| `data.user.result.legacy.description` | string | Bio text | LINK_BROKEN scanning |
| `data.user.result.legacy.url` | string | Bio URL | LINK_BROKEN validation |

**Rejected Properties:**
- `birthdate` - Privacy sensitive, not needed
- `translator_type` - Not relevant
- `advertiser_account_*` - Not needed for automation
- `withheld_in_countries` - Not needed
- `followed_by_verified_count` - Nice to have, not MVP

---

### 2. Tweet Detail Endpoint (`tweet-detail.json`)

**Selected Properties:**

| Property Path | Type | Used For | Triggers/Actions |
|--------------|------|----------|-----------------|
| `data.tweetResult.rest_id` | string | Tweet ID | All tweet operations |
| `data.tweetResult.legacy.created_at` | string | Creation time | All time-based triggers |
| `data.tweetResult.legacy.text` | string | Tweet content | REPLY_TO_TWEET, NEGATIVE_SENTIMENT |
| `data.tweetResult.legacy.entities.hashtags[].text` | array | Hashtags | Trending detection (future) |
| `data.tweetResult.legacy.entities.user_mentions[].screen_name` | array | Mentions | NEW_MENTION trigger |
| `data.tweetResult.legacy.entities.urls[].expanded_url` | array | URLs | LINK_BROKEN scanning |
| `data.tweetResult.legacy.in_reply_to_status_id_str` | string | Parent tweet | NEW_REPLY detection |
| `data.tweetResult.legacy.in_reply_to_user_id_str` | string | Parent user | NEW_REPLY validation |
| `data.tweetResult.legacy.retweet_count` | number | RT count | HIGH_ENGAGEMENT calculation |
| `data.tweetResult.legacy.favorite_count` | number | Like count | HIGH_ENGAGEMENT calculation |
| `data.tweetResult.legacy.reply_count` | number | Reply count | HIGH_ENGAGEMENT calculation |
| `data.tweetResult.legacy.quote_count` | number | Quote count | POST_QUOTED (future) |
| `data.tweetResult.legacy.conversation_id_str` | string | Thread ID | Thread detection (future) |
| `data.tweetResult.legacy.lang` | string | Language | Filtering |
| `data.tweetResult.views.count` | string | View count | HIGH_ENGAGEMENT (bonus) |
| `data.tweetResult.core.user_results.result.rest_id` | string | Author ID | FOLLOW_USER, BLOCK_USER |
| `data.tweetResult.core.user_results.result.legacy.screen_name` | string | Author handle | Template variables |
| `data.tweetResult.previous_counts` | object | Change tracking | Engagement spike detection |

**Rejected Properties:**
- `edit_control` - Not needed for automation
- `card` - Media handling, not MVP
- `note_tweet` - Extended tweets, not needed
- `possibly_sensitive` - Not needed for MVP

---

### 3. Mentions Endpoint (`mentions.json`)

**Selected Properties:**

| Property Path | Type | Used For | Triggers |
|--------------|------|----------|----------|
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.rest_id` | string | Tweet ID | NEW_MENTION |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.created_at` | string | Time | NEW_MENTION freshness |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.text` | string | Content | NEGATIVE_SENTIMENT |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.entities.user_mentions[].id_str` | array | Mentioned users | NEW_MENTION validation |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.in_reply_to_status_id_str` | string | Parent tweet | Context |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.rest_id` | string | Author ID | SEND_DM, FOLLOW_USER |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.legacy.screen_name` | string | Author handle | Template: {{authorUsername}} |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.legacy.name` | string | Author name | Templates |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.legacy.followers_count` | number | Author followers | HIGH_VALUE_FOLLOWER (future) |
| `data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.legacy.verified` | boolean | Author verified | Priority handling |

**Note:** Mentions endpoint returns the SAME structure as regular tweets but filtered to @mentions.

---

### 4. Followers Endpoint (`followers.json`)

**Selected Properties:**

| Property Path | Type | Used For | Triggers/Actions |
|--------------|------|----------|-----------------|
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.rest_id` | string | User ID | FOLLOW_BACK, ADD_TO_LIST |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.screen_name` | string | Username | Templates |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.name` | string | Display name | WELCOME_DM |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.followers_count` | number | Their followers | HIGH_VALUE_FOLLOWER |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.verified` | boolean | Verified status | VIP detection |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.created_at` | string | Account age | Quality check |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.followed_by` | boolean | They follow me | FOLLOW_BACK validation |
| `data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.following` | boolean | I follow them | FOLLOW_BACK validation |

**For UNFOLLOW Detection:**
Compare current followers list with cached list from previous sync.
Missing IDs = unfollows.

---

### 5. Retweets Endpoint (`retweets.json`)

**Selected Properties:**

| Property Path | Type | Used For | Triggers |
|--------------|------|----------|----------|
| `data.retweeters_timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.rest_id` | string | Retweeter ID | POST_REPOSTED |
| `data.retweeters_timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.screen_name` | string | Username | Templates |
| `data.retweeters_timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.followers_count` | number | Their reach | Viral potential |
| `data.source_tweet.legacy.retweet_count` | number | Total RTs | HIGH_ENGAGEMENT |

---

## Property Mapping to Triggers

### Trigger: NEW_MENTION
**Required Properties:**
```json
{
  "mentionId": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.rest_id",
  "text": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.text",
  "createdAt": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.created_at",
  "authorId": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.rest_id",
  "authorUsername": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.legacy.screen_name",
  "authorFollowers": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.core.user_results.result.legacy.followers_count"
}
```

### Trigger: NEW_REPLY
**Required Properties:**
```json
{
  "replyId": "data.tweetResult.rest_id",
  "parentTweetId": "data.tweetResult.legacy.in_reply_to_status_id_str",
  "text": "data.tweetResult.legacy.text",
  "authorId": "data.tweetResult.core.user_results.result.rest_id",
  "authorUsername": "data.tweetResult.core.user_results.result.legacy.screen_name"
}
```

### Trigger: POST_REPOSTED
**Required Properties:**
```json
{
  "tweetId": "data.source_tweet.id",
  "retweeterId": "data.retweeters_timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.rest_id",
  "retweeterUsername": "data.retweeters_timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.legacy.screen_name",
  "totalRetweets": "data.source_tweet.legacy.retweet_count"
}
```

### Trigger: HIGH_ENGAGEMENT
**Required Properties:**
```json
{
  "tweetId": "data.tweetResult.rest_id",
  "likes": "data.tweetResult.legacy.favorite_count",
  "replies": "data.tweetResult.legacy.reply_count",
  "retweets": "data.tweetResult.legacy.retweet_count",
  "quotes": "data.tweetResult.legacy.quote_count",
  "views": "data.tweetResult.views.count",
  "createdAt": "data.tweetResult.legacy.created_at"
}
```
**Calculation:** `total = likes + replies + retweets + quotes`

### Trigger: CONTENT_GAP
**Required Properties:**
```json
{
  "lastPostTime": "MAX(data.tweetResult.legacy.created_at)",
  "totalPosts": "data.user.result.legacy.statuses_count"
}
```
**Calculation:** `hoursSinceLastPost = (now - lastPostTime) / 3600000`

### Trigger: UNFOLLOW_DETECTED
**Required Properties:**
```json
{
  "currentFollowers": ["data.user.result.timeline.timeline.instructions[].entries[].content.itemContent.user_results.result.rest_id"]
}
```
**Calculation:** Compare with cached follower list from previous sync.

### Trigger: NEGATIVE_SENTIMENT
**Required Properties:**
```json
{
  "mentionId": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.rest_id",
  "text": "data.timeline.instructions[].entries[].content.itemContent.tweet_results.result.legacy.text"
}
```
**Detection:** Scan text for negative keywords.

### Trigger: LINK_BROKEN
**Required Properties:**
```json
{
  "bioUrl": "data.user.result.legacy.url",
  "tweetUrls": "data.tweetResult.legacy.entities.urls[].expanded_url"
}
```
**Validation:** HTTP HEAD request to check status code.

---

## Property Mapping to Actions

### Action: REPLY_TO_TWEET
**Required Properties:**
```json
{
  "tweetId": "triggerData.mentionId | triggerData.tweetId",
  "text": "config.text (with {{authorUsername}} template)"
}
```

### Action: SEND_DM
**Required Properties:**
```json
{
  "userId": "triggerData.authorId | triggerData.followerId",
  "text": "config.text"
}
```

### Action: FOLLOW_BACK
**Required Properties:**
```json
{
  "userId": "triggerData.followerId",
  "verified": "triggerData.followerVerified"
}
```

### Action: ADD_TO_LIST
**Required Properties:**
```json
{
  "listId": "config.listId",
  "userId": "triggerData.authorId | triggerData.followerId"
}
```

### Action: BLOCK_USER
**Required Properties:**
```json
{
  "userId": "triggerData.authorId"
}
```

---

## Caching Strategy

**Frequently Synced (Every 5-15 minutes):**
- Mentions (NEW_MENTION)
- Replies (NEW_REPLY)
- Retweets (POST_REPOSTED)
- DMs (NEW_DM)

**Moderately Synced (Every 30-60 minutes):**
- Followers (UNFOLLOW_DETECTED, FOLLOW_BACK)
- User timeline (CONTENT_GAP)

**Infrequently Synced (Every 4-24 hours):**
- Link validation (LINK_BROKEN)
- Full follower list comparison

---

## SIMDJSON Parsing Strategy

For performance-critical paths (mentions, timeline), use `simdjson_nodejs`:

```typescript
import { parse } from "simdjson";

// Fast extraction of specific fields without full parse
const extractMentions = (json: string) => {
  const doc = parse(json);
  
  // Navigate to mentions array efficiently
  const entries = doc.data.timeline.instructions[0].entries;
  
  return entries.map((entry: any) => ({
    mentionId: entry.content.itemContent.tweet_results.result.rest_id,
    text: entry.content.itemContent.tweet_results.result.legacy.text,
    authorId: entry.content.itemContent.tweet_results.result.core.user_results.result.rest_id,
    authorUsername: entry.content.itemContent.tweet_results.result.core.user_results.result.legacy.screen_name,
  }));
};
```

**Performance Gain:** ~3-5x faster than standard JSON.parse for large responses.

---

## Error Handling

**Missing Properties:**
- If `rest_id` missing → Skip record, log warning
- If `text` missing → Skip, not a valid tweet
- If `created_at` missing → Use current time

**Null/Undefined Values:**
- `followers_count: null` → Treat as 0
- `verified: undefined` → Treat as false
- `url: null` → Skip LINK_BROKEN check

---

## Summary Table: All Properties

| Endpoint | Properties Selected | Properties Rejected | Usage |
|----------|-------------------|-------------------|-------|
| User Timeline | 12 | 15 | Auth, follower tracking |
| Tweet Detail | 17 | 8 | Engagement, replies |
| Mentions | 10 | 5 | NEW_MENTION trigger |
| Followers | 8 | 10 | FOLLOW_BACK, UNFOLLOW |
| Retweets | 4 | 2 | POST_REPOSTED trigger |

**Total Selected: 51 properties**
**Total Rejected: 40 properties**

---

## Next Steps

1. ✅ Property selection complete
2. ⏳ Implement data sync service (RapidAPI client)
3. ⏳ Implement caching layer (Redis)
4. ⏳ Implement cron jobs for sync

---

*Document Version: 1.0*
*Last Updated: Phase 5 Planning*
*Status: APPROVED FOR IMPLEMENTATION*
