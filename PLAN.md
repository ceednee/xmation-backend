# Xmation Backend System - Streamlined Plan

## Overview
A backend API-only automation system for X (Twitter) that allows users to create workflows with triggers and actions, featuring dry-run testing, versioning, and analytics.

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Bun | Fast JavaScript/TypeScript runtime |
| **Framework** | Elysia.js | High-performance API framework |
| **Database** | Convex | Real-time DB + Auth + Crons |
| **Authentication** | Convex Auth | X OAuth + session management |
| **Scheduler** | Convex Crons | Background jobs |
| **X Data** | RapidAPI | Fetch X posts, mentions, followers |
| **Lint/Format** | Biome + Ultracite | Code quality |
| **Testing** | Bun Test | Unit + integration tests |
| **Local Dev** | Docker Compose | Development environment |
| **Security** | Multi-layer | See `SECURITY_PLAN.md` |

---

## Prerequisites for All Users

> ⚠️ **CRITICAL**: Every user MUST authenticate their X.com account before accessing ANY system features.

### Authentication Flow
1. User clicks "Connect X Account" (React + Convex Auth)
2. Convex Auth initiates X OAuth flow
3. User grants permissions on X.com
4. **X tokens encrypted and stored in Convex**
5. Only then can user create workflows, triggers, actions

### X OAuth Scopes Required
```
tweet.read, tweet.write, users.read, follows.read, follows.write,
dm.read, dm.write, offline.access
```

---

## Core Concepts

### 1. Workflow
A user-defined automation with:
- **Triggers**: When to run
- **Actions**: What to do
- **Versioning**: Draft → Publish → Rollback
- **Dry-Run Mode**: Test without affecting X

---

## Triggers (80 Total - Customer-Friendly)

### 🎯 Growth Triggers (12)
| Trigger | Description | When |
|---------|-------------|------|
| `NEW_FOLLOWER` | Someone follows you | When: New Follower |
| `HIGH_VALUE_FOLLOWER` | 10K+ or verified follows you | When: VIP Follows |
| `UNFOLLOW_DETECTED` | Someone unfollowed you | When: Unfollow |
| `FOLLOWER_MILESTONE` | Hit 1K/10K/100K/etc | When: Milestone Hit |
| `MILESTONE_APPROACHING` | 50 away from milestone | When: Milestone Near |
| `GROWTH_SPIKE` | 100+ new followers in 24h | When: Growth Spike |
| `GROWTH_STALL` | No new followers in 48h | When: Growth Stalled |
| `LOOKALIKE_FOLLOWER` | Follows similar accounts | When: Target Audience |
| `INFLUENCER_FOLLOW` | Big account follows you | When: Influencer Follow |
| `VERIFIED_FOLLOWER` | Verified user follows | When: Verified Follows |
| `CLEAN_FOLLOW` | Follower with good ratio | When: Quality Follow |
| `GEO_FOLLOWER` | Follower from target location | When: Local Follower |

### 💬 Engagement Triggers (12)
| Trigger | Description | When |
|---------|-------------|------|
| `NEW_MENTION` | Someone @mentions you | When: Mentioned |
| `NEW_REPLY` | Someone replies to your tweet | When: Replied |
| `POST_LIKED` | Someone likes your post | When: Post Liked |
| `POST_REPOSTED` | Someone retweets you | When: Reposted |
| `POST_QUOTED` | Someone quote-tweets you | When: Quoted |
| `NEW_DM` | New direct message | When: DM Received |
| `HIGH_ENGAGEMENT` | Post gets 100+ likes fast | When: Going Viral |
| `VIRAL_MOMENTUM` | 2x normal engagement rate | When: Trending Up |
| `FIRST_INTERACTION` | New person engages | When: New Connection |
| `REPEAT_ENGAGER` | Same person 3+ times | When: Super Engager |
| `SUPER_FAN` | Liked 5+ recent posts | When: Super Fan |
| `ENGAGEMENT_DROP` | Engagement down 50% | When: Engagement Drop |

### 📝 Content Triggers (12)
| Trigger | Description | When |
|---------|-------------|------|
| `OPTIMAL_POST_TIME` | Best time to post | Schedule: Optimal Time |
| `CONTENT_GAP` | No posts in 24h | When: Content Gap |
| `TOP_POST_CANDIDATE` | Post performing well | When: Top Post |
| `EVERGREEN_READY` | Old top post to recycle | When: Recycle Content |
| `UNDERPERFORMER` | Post below average | When: Underperformer |
| `THREAD_OPPORTUNITY` | Viral tweet expandable | When: Thread Potential |
| `TRENDING_TOPIC` | Your niche trending | When: Trending |
| `DAILY_SCHEDULE` | Every day at time | Schedule: Daily |
| `WEEKLY_SCHEDULE` | Every week at time | Schedule: Weekly |
| `BEST_PERFORMING_DAY` | Historical best day | When: Best Day |
| `POST_ANNIVERSARY` | 1 year since top post | When: Anniversary |
| `BIRTHDAY_POST` | User's birthday | When: Birthday |

### 🎁 Lead Generation Triggers (10)
| Trigger | Description | When |
|---------|-------------|------|
| `QUESTION_IN_NICHE` | "How do I..." + keyword | When: Question Asked |
| `HELP_REQUESTED` | "Looking for help" | When: Help Needed |
| `RECOMMENDATION_REQUEST` | "Any recommendations" | When: Advice Needed |
| `PROBLEM_MENTIONED` | Problem in your niche | When: Problem Posted |
| `SERVICE_INQUIRY` | Someone asks about service | When: Service Inquiry |
| `PRICING_QUESTION` | "How much does..." | When: Pricing Asked |
| `BOOKING_INTENT` | "Book", "schedule" | When: Booking Intent |
| `DM_ME_SAID` | "DM me" in reply | When: DM Request |
| `INTEREST_SIGNAL` | "Interested", "want this" | When: Interest Shown |
| `COMPLIMENT_RECEIVED` | Someone praises you | When: Compliment |

### 👥 Community Triggers (10)
| Trigger | Description | When |
|---------|-------------|------|
| `FOLLOW_ANNIVERSARY` | 1 year since follow | When: Follow Anniversary |
| `INACTIVE_FOLLOWER` | Silent for 90 days | When: Inactive Follower |
| `NEW_COMMUNITY_MEMBER` | Joined recently + engaged | When: New Member |
| `COMMUNITY_MVP` | Top 10% engager | When: MVP Activity |
| `BIRTHDAY_FOLLOWER` | Follower's birthday | When: Follower Birthday |
| `MENTOR_OPPORTUNITY` | Asks for advice often | When: Mentor Needed |
| `COLLAB_OPPORTUNITY` | Complementary business | When: Collab Potential |
| `PARTNERSHIP_SIGNAL` | "Partner", "collaborate" | When: Partnership |
| `INFLUencer_MENTION` | Influencer mentions you | When: Influencer Tag |
| `MEDIA_MENTION` | Blog/news mentions you | When: Press Mention |

### 🏢 Business Triggers (8)
| Trigger | Description | When |
|---------|-------------|------|
| `COMPETITOR_POSTED` | Competitor tweeted | When: Competitor Active |
| `COMPETITOR_VIRAL` | Their post exploding | When: Competitor Viral |
| `COMPETITOR_PROMO` | They announced sale | When: Competitor Promo |
| `INDUSTRY_NEWS` | News in your industry | When: Industry News |
| `JOB_OPPORTUNITY` | "We're hiring" | When: Job Posted |
| `EVENT_ANNOUNCEMENT` | Conference/event announced | When: Event Announced |
| `SPEAKING_OPPORTUNITY` | Call for speakers | When: CFP Open |
| `PRODUCT_LAUNCH` | Product launch mentioned | When: Product Launch |

### 🔧 Utility Triggers (8)
| Trigger | Description | When |
|---------|-------------|------|
| `LINK_BROKEN` | Bio/pinned link 404s | When: Link Broken |
| `PROFILE_INCOMPLETE` | Missing bio/avatar | When: Profile Incomplete |
| `RATE_LIMIT_WARNING` | Approaching X limits | When: Rate Limit Near |
| `TOKEN_EXPIRING` | X token expires soon | When: Token Expiring |
| `DUPLICATE_CONTENT` | About to post duplicate | When: Duplicate Detected |
| `SCHEDULE_CONFLICT` | Two posts same time | When: Schedule Conflict |
| `ACCOUNT_SILENT` | No activity 7 days | When: Account Silent |
| `MANUAL_TRIGGER` | User clicks button | When: Manual |

### ⚠️ Protection Triggers (8)
| Trigger | Description | When |
|---------|-------------|------|
| `NEGATIVE_SENTIMENT` | Bad sentiment spike | When: Negative Buzz |
| `SPAM_MENTION` | Likely bot mention | When: Spam Detected |
| `COPYCAT_CONTENT` | Someone copied your tweet | When: Copycat |
| `IMPERSONATOR` | Fake account detected | When: Impersonator |
| `MASS_UNFOLLOW` | Lost 10+ followers fast | When: Mass Unfollow |
| `SHADOWBAN_CHECK` | Daily visibility test | Schedule: Daily Check |
| `SUSPICIOUS_LOGIN` | New location/device | When: Suspicious Login |
| `UNAUTHORIZED_APP` | Unknown app access | When: Unauthorized App |

---

## Actions (50 Total - Customer-Friendly)

### ✉️ Engagement Actions (10)
| Action | Description | Then |
|--------|-------------|------|
| `REPLY_TO_TWEET` | Reply to mention/reply | Then: Reply |
| `LIKE_TWEET` | Like a tweet | Then: Like |
| `RETWEET` | Retweet content | Then: Retweet |
| `QUOTE_TWEET` | Quote with comment | Then: Quote Tweet |
| `SEND_DM` | Direct message user | Then: Send DM |
| `FOLLOW_USER` | Follow someone | Then: Follow |
| `WELCOME_DM` | Send welcome message | Then: Welcome DM |
| `THANK_YOU_REPLY` | Auto-thank for engagement | Then: Say Thanks |
| `ASK_QUESTION_REPLY` | Ask follow-up question | Then: Ask Question |
| `PROVIDE_VALUE_REPLY` | Share helpful resource | Then: Share Resource |

### 📝 Content Actions (10)
| Action | Description | Then |
|--------|-------------|------|
| `CREATE_POST` | Create new tweet | Then: Post Tweet |
| `CREATE_THREAD` | Multi-tweet thread | Then: Create Thread |
| `REPLY_AS_THREAD` | Reply with thread | Then: Reply Thread |
| `REPOST_WITH_COMMENT` | Quote tweet | Then: Repost & Comment |
| `PIN_TWEET` | Pin to profile | Then: Pin Tweet |
| `UNPIN_TWEET` | Unpin tweet | Then: Unpin |
| `DELETE_TWEET` | Remove tweet | Then: Delete |
| `SCHEDULE_POST` | Schedule for later | Then: Schedule |
| `DRAFT_POST` | Save as draft | Then: Draft |
| `RECYCLE_TOP_POST` | Repost old top content | Then: Recycle Post |

### 🎯 Growth Actions (8)
| Action | Description | Then |
|--------|-------------|------|
| `FOLLOW_BACK` | Follow new follower | Then: Follow Back |
| `SMART_FOLLOW` | Follow with criteria | Then: Smart Follow |
| `UNFOLLOW_INACTIVE` | Unfollow inactive users | Then: Clean Following |
| `ADD_TO_LIST` | Add to X list | Then: Add to List |
| `CREATE_LIST` | Make new X list | Then: Create List |
| `INVITE_TO_SPACE` | Invite to X Space | Then: Invite to Space |
| `REQUEST_FOLLOW` | Ask to follow back | Then: Request Follow |
| `SUGGEST_MUTUALS` | Suggest who to follow | Then: Suggest |

### 🎁 Lead Generation Actions (8)
| Action | Description | Then |
|--------|-------------|------|
| `SEND_LEAD_MAGNET` | DM free resource | Then: Send Resource |
| `BOOK_CALL_DM` | Send booking link | Then: Book Call |
| `QUALIFY_LEAD` | Ask qualifying questions | Then: Qualify |
| `TAG_LEAD` | Mark as hot/warm/cold | Then: Tag Lead |
| `SEND_PRICING` | Share pricing info | Then: Send Pricing |
| `SEND_PORTFOLIO` | Share work samples | Then: Send Portfolio |
| `SEND_TESTIMONIALS` | Share social proof | Then: Send Proof |
| `ESCALATE_TO_HUMAN` | Alert sales team | Then: Alert Team |

### 🔧 Utility Actions (8)
| Action | Description | Then |
|--------|-------------|------|
| `WAIT_DELAY` | Wait X minutes | Then: Wait |
| `CONDITION_CHECK` | If/Then logic | Then: Check Condition |
| `LOG_EVENT` | Log to analytics | Then: Log |
| `SEND_WEBHOOK` | Call external URL | Then: Webhook |
| `SEND_EMAIL` | Email notification | Then: Email |
| `SEND_SLACK` | Slack notification | Then: Slack |
| `UPDATE_CRM` | Update contact record | Then: Update CRM |
| `ADD_TO_SHEET` | Add to Google Sheet | Then: Add to Sheet |

### 🛡️ Protection Actions (6)
| Action | Description | Then |
|--------|-------------|------|
| `BLOCK_USER` | Block account | Then: Block |
| `MUTE_USER` | Mute account | Then: Mute |
| `REPORT_SPAM` | Report as spam | Then: Report |
| `HIDE_REPLY` | Hide tweet reply | Then: Hide Reply |
| `ENABLE_PAUSE` | Pause all workflows | Then: Pause |
| `ALERT_ADMIN` | Send security alert | Then: Alert Admin |

---

## Required Labels/Values

| Label | Values |
|-------|--------|
| **Evaluate** | `once`, `continuous`, `scheduled` |
| **Schedule** | `every X minutes/hours/days`, `cron` |
| **Processing Limit** | `unlimited`, `N per day/week/month` |
| **Duration** | `5min`, `1hour`, `custom` |
| **Last/Next** | timestamp |
| **Condition** | `If`, `Then`, `Else`, `And`, `Or` |
| **Use Template** | template_id |
| **When/Then/If/After/Before** | workflow flow |

---

## Database Schema (Simplified)

### `users_x` (X-connected users)
```typescript
{
  _id: Id<"users_x">;
  userId: Id<"users">;          // Convex Auth user
  xUserId: string;               // X.com ID
  xUsername: string;
  xAccessToken: string;          // Encrypted
  xRefreshToken: string;         // Encrypted
  xTokenExpiresAt: number;
  profile: {                     // From RapidAPI
    displayName, avatarUrl, bio,
    followersCount, verified
  };
  preferences: {
    timezone, dryRunDefault
  };
}
```

### `workflows`
```typescript
{
  _id: Id<"workflows">;
  userId: Id<"users">;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused';
  currentVersionId: Id<"versions">;
  isDryRun: boolean;
  triggers: TriggerConfig[];
  actions: ActionConfig[];
  createdAt: number;
}
```

### `workflow_versions`
```typescript
{
  _id: Id<"versions">;
  workflowId: Id<"workflows">;
  version: number;
  status: 'draft' | 'published';
  triggers: TriggerConfig[];
  actions: ActionConfig[];
  publishedAt?: number;
}
```

### `workflow_runs`
```typescript
{
  _id: Id<"runs">;
  workflowId: Id<"workflows">;
  status: 'running' | 'completed' | 'failed';
  mode: 'live' | 'dry_run';
  startedAt: number;
  completedAt?: number;
}
```

### `analytics_events`
```typescript
{
  _id: Id<"events">;
  userId: Id<"users">;
  eventType: string;
  timestamp: number;
  metadata: Record<string, any>;
}
```

---

## API Routes (Simplified)

### Auth
- `GET /auth/me` - Current user

### Workflows
- `GET /workflows` - List workflows
- `POST /workflows` - Create workflow
- `GET /workflows/:id` - Get workflow
- `PATCH /workflows/:id` - Update workflow
- `DELETE /workflows/:id` - Delete workflow
- `POST /workflows/:id/activate` - Activate
- `POST /workflows/:id/pause` - Pause
- `POST /workflows/:id/test` - Dry-run test

### Versions
- `GET /workflows/:id/versions` - List versions
- `POST /workflows/:id/versions` - Save version
- `POST /versions/:id/rollback` - Rollback

### Analytics
- `GET /analytics/dashboard` - Stats overview
- `GET /analytics/workflows/:id` - Workflow stats
- `GET /analytics/export` - Export data

---

## Implementation Phases

### Phase 0: Setup (Week 1)
- [ ] Project setup (Bun + Elysia + Convex)
- [ ] Configure Biome + Ultracite
- [ ] Setup Docker Compose
- [ ] Write first failing test

### Phase 1: Auth (Week 1-2)
- [ ] Convex Auth setup
- [ ] X OAuth integration
- [ ] Token encryption
- [ ] Auth middleware

### Phase 2: Core (Week 2-3)
- [ ] Workflow CRUD
- [ ] Versioning (draft/publish/rollback)
- [ ] Dry-run mode
- [ ] Basic trigger: Schedule
- [ ] Basic action: Create Post

### Phase 3: Triggers + Actions (Week 3-4)
- [ ] Implement top 20 triggers
- [ ] Implement top 20 actions
- [ ] Trigger evaluation cron
- [ ] Action execution

### Phase 4: Analytics (Week 4)
- [ ] Event tracking
- [ ] Dashboard queries
- [ ] Export functionality

### Phase 5: Polish (Week 5)
- [ ] Security hardening
- [ ] Performance optimization
- [ ] Documentation

---

## What's Missing (To Validate)

See `MISSING_FEATURES.md` for comprehensive list.

---

## Key Principles

1. **X Auth Required** - No X = no features
2. **Convex Single Stack** - DB + Auth + Crons
3. **TDD** - Tests first
4. **Security First** - See SECURITY_PLAN.md
5. **Customer-Friendly** - Easy to understand triggers/actions

---

*Simplified plan ready for implementation.*
