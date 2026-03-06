# Phase 5 Implementation Plan: Data Sync (RapidAPI + Cron Jobs)

> Based on the property selection analysis in `RAPIDAPI_PROPERTY_SELECTION.md`

---

## Overview

**Goal:** Implement data synchronization from X.com via RapidAPI to power our triggers and actions.

**Key Decisions:**
- 51 properties selected from 5 endpoints
- 40 properties rejected (unnecessary for MVP)
- Using `simdjson_nodejs` for fast JSON parsing
- Redis for caching (as per your decision)
- Convex crons for scheduling (as per your decision)

---

## Selected Properties Summary

### By Trigger

| Trigger | Required Properties | Endpoint |
|---------|-------------------|----------|
| NEW_MENTION | 6 properties | mentions.json |
| NEW_REPLY | 5 properties | tweet-detail.json |
| POST_REPOSTED | 4 properties | retweets.json |
| HIGH_ENGAGEMENT | 7 properties | tweet-detail.json |
| CONTENT_GAP | 2 properties | user-timeline.json |
| OPTIMAL_POST_TIME | 1 property | user-timeline.json (timezone) |
| UNFOLLOW_DETECTED | 1 property (list) | followers.json |
| NEW_DM | 6 properties | dm endpoint |
| MANUAL_TRIGGER | 0 properties | N/A |
| NEGATIVE_SENTIMENT | 2 properties | mentions.json |
| LINK_BROKEN | 2 properties | user-timeline.json + tweet-detail.json |

### By Action

| Action | Required Properties | Source |
|--------|-------------------|--------|
| REPLY_TO_TWEET | 2 properties | triggerData |
| RETWEET | 1 property | triggerData |
| QUOTE_TWEET | 2 properties | triggerData |
| SEND_DM | 2 properties | triggerData |
| FOLLOW_USER | 1 property | triggerData |
| FOLLOW_BACK | 2 properties | triggerData |
| WELCOME_DM | 2 properties | triggerData |
| PIN_TWEET | 1 property | triggerData |
| WAIT_DELAY | 0 properties | N/A |
| CONDITION_CHECK | 1 property | triggerData |
| LOG_EVENT | 4 properties | context |
| THANK_YOU_REPLY | 2 properties | triggerData |
| ADD_TO_LIST | 2 properties | config + triggerData |
| BLOCK_USER | 1 property | triggerData |
| REPORT_SPAM | 2 properties | config + triggerData |
| ALERT_ADMIN | 3 properties | context |

---

## Critical Property Choices (Why These Matter)

### 1. `rest_id` vs `id_str`
**Choice:** Use `rest_id` for all user/tweet identification
**Reason:** 
- `rest_id` is the GraphQL node ID (base64 encoded)
- More stable across API versions
- Used for all X API operations

### 2. Engagement Calculation
**Choice:** `favorite_count + reply_count + retweet_count + quote_count`
**Reason:**
- Complete picture of engagement
- Views not always available (privacy)
- Excludes impressions (not actionable)

### 3. Mention Detection
**Choice:** Use `in_reply_to_user_id_str` + mentions in entities
**Reason:**
- Direct replies have `in_reply_to_*` fields
- Mentions in text without reply need entity parsing
- Covers both @mentions in new tweets and replies

### 4. Follower Tracking
**Choice:** Compare full follower lists over time
**Reason:**
- No "unfollow event" in API
- Must diff current vs previous list
- Store in Redis with TTL

### 5. Negative Sentiment
**Choice:** Keyword scanning in `text` field
**Reason:**
- No native sentiment API from X
- Simple keyword list covers 80% of cases
- Can enhance with external NLP service later

### 6. Broken Links
**Choice:** Validate `url` field + tweet URLs
**Reason:**
- Bio link most important (profile)
- Tweet URLs secondary
- Must make HTTP HEAD requests

---

## Implementation Strategy

### Step 1: Install simdjson
```bash
bun add simdjson
```

### Step 2: Create Data Types
Create `src/types/rapidapi.ts` with extracted property types.

### Step 3: Create Extractor Functions
Create `src/services/data-extractor.ts` with simdjson parsing.

### Step 4: Create RapidAPI Client
Create `src/services/rapidapi-client.ts` with endpoint wrappers.

### Step 5: Create Sync Service
Create `src/services/sync-service.ts` with caching logic.

### Step 6: Create Cron Jobs
Create Convex cron functions for scheduled sync.

---

## Sync Schedule

```
Every 5 minutes:
  - mentions (NEW_MENTION)
  - replies (NEW_REPLY)
  
Every 15 minutes:
  - retweets (POST_REPOSTED)
  - user timeline (CONTENT_GAP)
  
Every 30 minutes:
  - followers (UNFOLLOW_DETECTED, FOLLOW_BACK)
  
Every 4 hours:
  - link validation (LINK_BROKEN)
```

---

## Caching Strategy (Redis)

**Cache Keys:**
```
x:user:{userId}:mentions:last_id -> string
x:user:{userId}:mentions:data -> hash
x:user:{userId}:followers:list -> set
x:user:{userId}:followers:last_count -> string
x:user:{userId}:timeline:last_tweet_time -> string
x:user:{userId}:links:status -> hash
```

**TTL:**
- Mentions: 15 minutes
- Followers: 30 minutes
- Timeline: 60 minutes
- Links: 24 hours

---

## Files to Create

```
src/
├── types/
│   └── rapidapi.ts          # TypeScript types for selected properties
├── services/
│   ├── data-extractor.ts    # simdjson extraction functions
│   ├── rapidapi-client.ts   # API client
│   └── sync-service.ts      # Sync orchestration
└── crons/
    └── sync-jobs.ts         # Convex cron functions
```

---

## Testing Strategy

1. Mock RapidAPI responses using sample JSON files
2. Test property extraction accuracy
3. Test sync logic with simulated data changes
4. Test caching behavior
5. Test error handling for missing properties

---

## Risk Mitigation

**Risk 1: Property missing from response**
- Mitigation: All extractors have fallbacks
- Log warnings, continue with partial data

**Risk 2: API rate limits**
- Mitigation: Redis caching reduces calls
- Exponential backoff on 429 errors

**Risk 3: Property path changes**
- Mitigation: Centralized extraction functions
- Single place to update paths

---

## Success Criteria

- [ ] All 11 triggers receive correct data
- [ ] All 16 actions receive correct context
- [ ] Sync completes within schedule windows
- [ ] Redis cache hit rate > 80%
- [ ] No property-related errors in logs

---

## Approval Required

Before proceeding with implementation, confirm:

1. ✅ Property selection meets trigger/action needs
2. ✅ Caching strategy acceptable
3. ✅ Sync schedule acceptable
4. ✅ Ready to proceed with code implementation

---

**Status:** Awaiting approval to proceed with implementation

*This plan is based on the property selection in `RAPIDAPI_PROPERTY_SELECTION.md`*
