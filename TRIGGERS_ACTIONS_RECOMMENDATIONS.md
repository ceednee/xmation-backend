# Xmation Backend Assistant - Complete Triggers & Actions

> 80 Customer-Friendly Triggers + 50 Customer-Friendly Actions

---

## 🎯 TRIGGERS (80 Total)

### Growth Triggers (12)
Track and respond to follower growth opportunities.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 1 | **NEW_FOLLOWER** | Someone follows you | "When Someone Follows Me" |
| 2 | **HIGH_VALUE_FOLLOWER** | 10K+ or verified follows | "When VIP Follows Me" |
| 3 | **UNFOLLOW_DETECTED** | Someone unfollowed | "When Someone Unfollows" |
| 4 | **FOLLOWER_MILESTONE** | Hit 1K/10K/100K | "When I Hit a Milestone" |
| 5 | **MILESTONE_APPROACHING** | 50 away from milestone | "When Milestone is Near" |
| 6 | **GROWTH_SPIKE** | 100+ new followers in 24h | "When Growth Spikes" |
| 7 | **GROWTH_STALL** | No new followers in 48h | "When Growth Stalls" |
| 8 | **LOOKALIKE_FOLLOWER** | Follows similar accounts | "When Target Audience Finds Me" |
| 9 | **INFLUENCER_FOLLOW** | Big account follows | "When Influencer Follows" |
| 10 | **VERIFIED_FOLLOWER** | Verified user follows | "When Verified Account Follows" |
| 11 | **CLEAN_FOLLOW** | Follower with good ratio | "When Quality Account Follows" |
| 12 | **GEO_FOLLOWER** | From target location | "When Local Follower Joins" |

**Best Workflow**: NEW_FOLLOWER → WELCOME_DM (for 1K+ followers) → ADD_TO_LIST

---

### Engagement Triggers (12)
Respond to interactions with your content.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 13 | **NEW_MENTION** | Someone @mentions you | "When I'm Mentioned" |
| 14 | **NEW_REPLY** | Someone replies | "When Someone Replies" |
| 15 | **POST_LIKED** | Someone likes your post | "When Post Gets Liked" |
| 16 | **POST_REPOSTED** | Someone retweets | "When Post is Reposted" |
| 17 | **POST_QUOTED** | Someone quote-tweets | "When Post is Quoted" |
| 18 | **NEW_DM** | New direct message | "When I Get a DM" |
| 19 | **HIGH_ENGAGEMENT** | 100+ likes fast | "When Post Goes Viral" |
| 20 | **VIRAL_MOMENTUM** | 2x normal engagement | "When Engagement Spikes" |
| 21 | **FIRST_INTERACTION** | New person engages | "When New Person Engages" |
| 22 | **REPEAT_ENGAGER** | Same person 3+ times | "When Someone Engages Often" |
| 23 | **SUPER_FAN** | Liked 5+ recent posts | "When Super Fan Detected" |
| 24 | **ENGAGEMENT_DROP** | Engagement down 50% | "When Engagement Drops" |

**Best Workflow**: NEW_MENTION → IF (follower_count > 1000) → REPLY + LIKE

---

### Content Triggers (12)
Optimize your posting strategy.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 25 | **OPTIMAL_POST_TIME** | Best time to post | "When It's Best Time to Post" |
| 26 | **CONTENT_GAP** | No posts in 24h | "When I Haven't Posted" |
| 27 | **TOP_POST_CANDIDATE** | Post performing well | "When Post is Performing Well" |
| 28 | **EVERGREEN_READY** | Old top post to recycle | "When to Recycle Content" |
| 29 | **UNDERPERFORMER** | Post below average | "When Post Underperforms" |
| 30 | **THREAD_OPPORTUNITY** | Viral tweet expandable | "When to Expand to Thread" |
| 31 | **TRENDING_TOPIC** | Your niche trending | "When My Niche Trends" |
| 32 | **DAILY_SCHEDULE** | Every day at time | "Every Day At..." |
| 33 | **WEEKLY_SCHEDULE** | Every week at time | "Every Week On..." |
| 34 | **BEST_PERFORMING_DAY** | Historical best day | "On My Best Day" |
| 35 | **POST_ANNIVERSARY** | 1 year since top post | "When Post Anniversary" |
| 36 | **BIRTHDAY_POST** | User's birthday | "On My Birthday" |

**Best Workflow**: OPTIMAL_POST_TIME → CREATE_POST (from queue)

---

### Lead Generation Triggers (10)
Find and qualify potential customers.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 37 | **QUESTION_IN_NICHE** | "How do I..." + keyword | "When Question in My Niche" |
| 38 | **HELP_REQUESTED** | "Looking for help" | "When Someone Needs Help" |
| 39 | **RECOMMENDATION_REQUEST** | "Any recommendations" | "When Recommendations Asked" |
| 40 | **PROBLEM_MENTIONED** | Problem in your niche | "When Problem Mentioned" |
| 41 | **SERVICE_INQUIRY** | Asks about service | "When Service Inquiry" |
| 42 | **PRICING_QUESTION** | "How much does..." | "When Pricing Asked" |
| 43 | **BOOKING_INTENT** | "Book", "schedule" | "When Booking Intent" |
| 44 | **DM_ME_SAID** | "DM me" in reply | "When DM Requested" |
| 45 | **INTEREST_SIGNAL** | "Interested", "want" | "When Interest Shown" |
| 46 | **COMPLIMENT_RECEIVED** | Someone praises you | "When I Get Compliment" |

**Best Workflow**: QUESTION_IN_NICHE → IF (their_followers > 500) → REPLY + DM resource

---

### Community Triggers (10)
Build and nurture your community.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 47 | **FOLLOW_ANNIVERSARY** | 1 year since follow | "When Follow Anniversary" |
| 48 | **INACTIVE_FOLLOWER** | Silent for 90 days | "When Follower Goes Silent" |
| 49 | **NEW_COMMUNITY_MEMBER** | Joined + engaged | "When New Member Joins" |
| 50 | **COMMUNITY_MVP** | Top 10% engager | "When Community MVP Acts" |
| 51 | **BIRTHDAY_FOLLOWER** | Follower's birthday | "When Follower Birthday" |
| 52 | **MENTOR_OPPORTUNITY** | Asks advice often | "When Mentoring Needed" |
| 53 | **COLLAB_OPPORTUNITY** | Complementary biz | "When Collab Possible" |
| 54 | **PARTNERSHIP_SIGNAL** | "Partner", "collaborate" | "When Partnership Mentioned" |
| 55 | **INFLUENCER_MENTION** | Influencer tags you | "When Influencer Mentions Me" |
| 56 | **MEDIA_MENTION** | Blog/news mentions | "When Press Mentions Me" |

**Best Workflow**: COMMUNITY_MVP → REWARD_DM (exclusive content)

---

### Business Triggers (8)
Stay informed about industry and competition.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 57 | **COMPETITOR_POSTED** | Competitor tweeted | "When Competitor Posts" |
| 58 | **COMPETITOR_VIRAL** | Their post exploding | "When Competitor Goes Viral" |
| 59 | **COMPETITOR_PROMO** | They announced sale | "When Competitor Promotes" |
| 60 | **INDUSTRY_NEWS** | News in industry | "When Industry News" |
| 61 | **JOB_OPPORTUNITY** | "We're hiring" | "When Job Posted" |
| 62 | **EVENT_ANNOUNCEMENT** | Event announced | "When Event Announced" |
| 63 | **SPEAKING_OPPORTUNITY** | Call for speakers | "When Speaking Opportunity" |
| 64 | **PRODUCT_LAUNCH** | Product launch mentioned | "When Product Launch" |

**Best Workflow**: COMPETITOR_VIRAL → ANALYZE → CREATE_SIMILAR_CONTENT

---

### Utility Triggers (8)
System health and maintenance.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 65 | **LINK_BROKEN** | Bio/pinned link 404s | "When Link Breaks" |
| 66 | **PROFILE_INCOMPLETE** | Missing bio/avatar | "When Profile Incomplete" |
| 67 | **RATE_LIMIT_WARNING** | Approaching X limits | "When Rate Limit Near" |
| 68 | **TOKEN_EXPIRING** | X token expires soon | "When Token Expiring" |
| 69 | **DUPLICATE_CONTENT** | About to post duplicate | "When Duplicate Detected" |
| 70 | **SCHEDULE_CONFLICT** | Two posts same time | "When Schedule Conflict" |
| 71 | **ACCOUNT_SILENT** | No activity 7 days | "When Account Silent" |
| 72 | **MANUAL_TRIGGER** | User clicks button | "When I Click Button" |

---

### Protection Triggers (8)
Protect your brand and account.

| # | Trigger | Description | Customer-Friendly Label |
|---|---------|-------------|------------------------|
| 73 | **NEGATIVE_SENTIMENT** | Bad sentiment spike | "When Negative Sentiment" |
| 74 | **SPAM_MENTION** | Likely bot mention | "When Spam Detected" |
| 75 | **COPYCAT_CONTENT** | Someone copied tweet | "When Copycat Detected" |
| 76 | **IMPERSONATOR** | Fake account detected | "When Impersonator Found" |
| 77 | **MASS_UNFOLLOW** | Lost 10+ fast | "When Mass Unfollow" |
| 78 | **SHADOWBAN_CHECK** | Daily visibility test | "Daily Shadowban Check" |
| 79 | **SUSPICIOUS_LOGIN** | New location/device | "When Suspicious Login" |
| 80 | **UNAUTHORIZED_APP** | Unknown app access | "When Unauthorized Access" |

---

## ⚡ ACTIONS (50 Total)

### Engagement Actions (10)
Respond to your audience.

| # | Action | Description | Customer-Friendly Label |
|---|--------|-------------|------------------------|
| 1 | **REPLY_TO_TWEET** | Reply to mention/reply | "Reply to Tweet" |
| 2 | **LIKE_TWEET** | Like a tweet | "Like Tweet" |
| 3 | **RETWEET** | Retweet content | "Retweet" |
| 4 | **QUOTE_TWEET** | Quote with comment | "Quote Tweet" |
| 5 | **SEND_DM** | Direct message | "Send DM" |
| 6 | **FOLLOW_USER** | Follow someone | "Follow User" |
| 7 | **WELCOME_DM** | Welcome message | "Send Welcome DM" |
| 8 | **THANK_YOU_REPLY** | Auto-thank | "Say Thank You" |
| 9 | **ASK_QUESTION_REPLY** | Ask follow-up | "Ask Question" |
| 10 | **PROVIDE_VALUE_REPLY** | Share resource | "Share Helpful Link" |

---

### Content Actions (10)
Create and manage content.

| # | Action | Description | Customer-Friendly Label |
|---|--------|-------------|------------------------|
| 11 | **CREATE_POST** | Create tweet | "Post Tweet" |
| 12 | **CREATE_THREAD** | Multi-tweet | "Create Thread" |
| 13 | **REPLY_AS_THREAD** | Reply with thread | "Reply as Thread" |
| 14 | **REPOST_WITH_COMMENT** | Quote tweet | "Repost with Comment" |
| 15 | **PIN_TWEET** | Pin to profile | "Pin to Profile" |
| 16 | **UNPIN_TWEET** | Unpin tweet | "Unpin Tweet" |
| 17 | **DELETE_TWEET** | Remove tweet | "Delete Tweet" |
| 18 | **SCHEDULE_POST** | Schedule later | "Schedule for Later" |
| 19 | **DRAFT_POST** | Save draft | "Save as Draft" |
| 20 | **RECYCLE_TOP_POST** | Repost old content | "Recycle Best Post" |

---

### Growth Actions (8)
Grow your following strategically.

| # | Action | Description | Customer-Friendly Label |
|---|--------|-------------|------------------------|
| 21 | **FOLLOW_BACK** | Follow new follower | "Follow Back" |
| 22 | **SMART_FOLLOW** | Follow with criteria | "Smart Follow" |
| 23 | **UNFOLLOW_INACTIVE** | Clean following | "Unfollow Inactive" |
| 24 | **ADD_TO_LIST** | Add to X list | "Add to List" |
| 25 | **CREATE_LIST** | Make new list | "Create New List" |
| 26 | **INVITE_TO_SPACE** | Invite to Space | "Invite to Space" |
| 27 | **REQUEST_FOLLOW** | Ask to follow | "Request Follow Back" |
| 28 | **SUGGEST_MUTUALS** | Suggest follows | "Suggest Who to Follow" |

---

### Lead Generation Actions (8)
Convert conversations to customers.

| # | Action | Description | Customer-Friendly Label |
|---|--------|-------------|------------------------|
| 29 | **SEND_LEAD_MAGNET** | DM free resource | "Send Free Resource" |
| 30 | **BOOK_CALL_DM** | Send booking link | "Send Booking Link" |
| 31 | **QUALIFY_LEAD** | Ask questions | "Qualify Lead" |
| 32 | **TAG_LEAD** | Mark hot/warm/cold | "Tag Lead" |
| 33 | **SEND_PRICING** | Share pricing | "Send Pricing" |
| 34 | **SEND_PORTFOLIO** | Share samples | "Send Portfolio" |
| 35 | **SEND_TESTIMONIALS** | Social proof | "Send Testimonials" |
| 36 | **ESCALATE_TO_HUMAN** | Alert sales | "Alert Sales Team" |

---

### Utility Actions (8)
System and workflow operations.

| # | Action | Description | Customer-Friendly Label |
|---|--------|-------------|------------------------|
| 37 | **WAIT_DELAY** | Wait X minutes | "Wait..." |
| 38 | **CONDITION_CHECK** | If/Then logic | "If/Then Condition" |
| 39 | **LOG_EVENT** | Log analytics | "Log Event" |
| 40 | **SEND_WEBHOOK** | External URL | "Send Webhook" |
| 41 | **SEND_EMAIL** | Email notification | "Send Email" |
| 42 | **SEND_SLACK** | Slack notification | "Send Slack Message" |
| 43 | **UPDATE_CRM** | Update contact | "Update CRM" |
| 44 | **ADD_TO_SHEET** | Google Sheet | "Add to Google Sheet" |

---

### Protection Actions (6)
Protect your account.

| # | Action | Description | Customer-Friendly Label |
|---|--------|-------------|------------------------|
| 45 | **BLOCK_USER** | Block account | "Block User" |
| 46 | **MUTE_USER** | Mute account | "Mute User" |
| 47 | **REPORT_SPAM** | Report spam | "Report as Spam" |
| 48 | **HIDE_REPLY** | Hide reply | "Hide Reply" |
| 49 | **ENABLE_PAUSE** | Pause workflows | "Pause All Workflows" |
| 50 | **ALERT_ADMIN** | Security alert | "Alert Admin" |

---

## 🔥 TOP 10 WORKFLOW RECIPES

### 1. The Welcome Wagon
```
Trigger: NEW_FOLLOWER
Condition: IF (follower_count > 1000)
Action: SEND_WELCOME_DM + ADD_TO_LIST("VIPs")
```

### 2. The Viral Booster
```
Trigger: HIGH_ENGAGEMENT (100+ likes in 1 hour)
Action: PIN_TWEET + QUOTE_TWEET ("Thanks for the love!")
```

### 3. The Lead Capture
```
Trigger: QUESTION_IN_NICHE
Condition: IF (their_followers > 500)
Action: REPLY_WITH_VALUE + SEND_LEAD_MAGNET (via DM)
```

### 4. The Super Fan Reward
```
Trigger: SUPER_FAN (5+ likes on recent posts)
Action: SEND_DM ("You're amazing! Here's exclusive content...")
```

### 5. The Consistency Keeper
```
Trigger: CONTENT_GAP (24h without post)
Action: RECYCLE_TOP_POST + LOG_EVENT
```

### 6. The Growth Accelerator
```
Trigger: LOOKALIKE_FOLLOWER
Action: LIKE_THEIR_RECENT + SMART_FOLLOW
```

### 7. The Reputation Guardian
```
Trigger: NEGATIVE_SENTIMENT
Action: ALERT_ADMIN + PAUSE_WORKFLOWS
```

### 8. The Engagement Maximizer
```
Trigger: OPTIMAL_POST_TIME
Action: CREATE_POST (from queue)
```

### 9. The Competitive Edge
```
Trigger: COMPETITOR_GAP (no post in 3 days)
Action: CREATE_POST (thought leadership)
```

### 10. The Milestone Maximizer
```
Trigger: MILESTONE_APPROACHING (50 from 10K)
Action: CREATE_POST ("Road to 10K! Thank you...")
```

---

## 📊 SUMMARY

| Category | Triggers | Actions |
|----------|----------|---------|
| Growth | 12 | 8 |
| Engagement | 12 | 10 |
| Content | 12 | 10 |
| Lead Gen | 10 | 8 |
| Community | 10 | - |
| Business | 8 | - |
| Utility | 8 | 8 |
| Protection | 8 | 6 |
| **TOTAL** | **80** | **50** |

---

*All triggers and actions use customer-friendly labels for easy understanding.*
