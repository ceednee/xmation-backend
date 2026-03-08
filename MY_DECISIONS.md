# My Decisions - Xmation Backend System

> Replace ⬜ with: ✅ (Implement) / ⏸️ (Defer) / ❌ (Skip)

---

## 🟢 ESSENTIAL MVP DECISIONS

### Authentication & Core
- [x] **X OAuth Integration** - Connect X account (REQUIRED)
- [x] **Token Encryption** - AES-256 for tokens
- [x] **Session Management** - Convex Auth sessions
- [x] **Token Refresh** - Auto-refresh before expiry
- [x] **Auth Middleware** - Protect all routes

### Workflows
- [x] **Workflow CRUD** - Create, read, update, delete
- [x] **Draft Mode** - Save without activating
- [x] **Publish Flow** - Draft → Published
- [x] **Versioning** - Save versions, rollback
- [x] **Dry-Run Mode** - Test without affecting X
- [x] **Activate/Pause** - Enable/disable workflows

### Essential 20 Triggers - YOUR PICKS
- [ ] `NEW_FOLLOWER` - New follower
- [x] `NEW_MENTION` - Someone mentions you
- [x] `NEW_REPLY` - Reply to your tweet
- [ ] `POST_LIKED` - Post liked
- [x] `POST_REPOSTED` - Post retweeted
- [x] `HIGH_ENGAGEMENT` - Post going viral
- [x] `CONTENT_GAP` - No posts in 24h
- [x] `OPTIMAL_POST_TIME` - Best time to post
- [ ] `DAILY_SCHEDULE` - Daily posting
- [ ] `WEEKLY_SCHEDULE` - Weekly posting
- [ ] `QUESTION_IN_NICHE` - Question in your niche
- [ ] `HELP_REQUESTED` - Help request
- [ ] `FOLLOWER_MILESTONE` - Hit milestone
- [x] `UNFOLLOW_DETECTED` - Someone unfollowed
- [x] `NEW_DM` - New direct message
- [x] `MANUAL_TRIGGER` - Button click
- [ ] `TRENDING_TOPIC` - Niche trending
- [ ] `COMPETITOR_POSTED` - Competitor active
- [x] `NEGATIVE_SENTIMENT` - Bad sentiment
- [x] `LINK_BROKEN` - Bio link broken

### Essential 20 Actions - YOUR PICKS
- [ ] `CREATE_POST` - Post tweet
- [x] `REPLY_TO_TWEET` - Reply to mention
- [ ] `LIKE_TWEET` - Like tweet
- [x] `RETWEET` - Retweet
- [x] `QUOTE_TWEET` - Quote tweet
- [x] `SEND_DM` - Direct message
- [x] `FOLLOW_USER` - Follow someone
- [x] `FOLLOW_BACK` - Follow back
- [x] `WELCOME_DM` - Welcome message
- [x] `PIN_TWEET` - Pin to profile
- [x] `WAIT_DELAY` - Wait X minutes
- [x] `CONDITION_CHECK` - If/Then logic
- [ ] `SEND_WEBHOOK` - External webhook
- [x] `LOG_EVENT` - Log to analytics
- [ ] `SEND_LEAD_MAGNET` - DM resource
- [x] `THANK_YOU_REPLY` - Auto-thank
- [x] `ADD_TO_LIST` - Add to X list
- [x] `BLOCK_USER` - Block spam
- [x] `REPORT_SPAM` - Report spam
- [x] `ALERT_ADMIN` - Security alert

### Data & Sync
- [x] **RapidAPI Integration** - Fetch X data
- [x] **Posts Sync** - Cache user's posts
- [x] **Mentions Sync** - Cache mentions
- [x] **Followers Sync** - Cache followers
- [x] **Cron Jobs** - 10/15/30 min syncs

### Analytics (Basic)
- [x] **Event Tracking** - Log all events
- [x] **Dashboard Stats** - Basic metrics
- [x] **Run History** - Workflow runs log
- [x] **Export CSV** - Export data

### Security (Essential)
- [x] **Rate Limiting** - 100 req/min
- [x] **Input Validation** - Zod schemas
- [x] **CORS** - Origin validation
- [x] **Security Headers** - CSP, HSTS
- [x] **Encryption** - Token encryption

---

## ❓ KEY QUESTIONS - YOUR ANSWERS

### Scope Questions
1. **LinkedIn automation too, or X only?**
   - [x] X only
   - [ ] Both X and LinkedIn

2. **A/B testing workflows for MVP?**
   - [ ] Yes, implement
   - [x] No, defer

3. **Real-time notifications (WebSocket) or polling?**
   - [x] WebSocket (real-time)
   - [ ] Polling (simpler)

4. **Image/video in posts for MVP?**
   - [ ] Yes, implement
   - [x] No, defer

5. **DM automation acceptable given X's strict policies?**
   - [x] Yes, with limits
   - [ ] No, skip for MVP

### Technical Questions
6. **Redis for caching or Convex only?**
   - [ ] Convex only
   - [x] Redis + Convex

7. **Separate worker processes or Convex crons?**
   - [x] Convex crons
   - [ ] Separate workers

8. **Webhook signatures for security?**
   - [x] Yes, implement
   - [ ] No, defer

9. **Multi-region deployment at launch?**
   - [ ] Yes
   - [x] No

10. **Automatic failover or manual recovery?**
    - [ ] Automatic
    - [x] Manual (OK for MVP)

### Business Questions
11. **Free tier or paid only?**
    - [x] Free tier
    - [ ] Paid only

12. **Team collaboration for MVP?**
    - [ ] Yes
    - [x] No

13. **White-label options?**
    - [ ] Yes
    - [x] No

14. **Mobile app or mobile web sufficient?**
    - [ ] Mobile app
    - [x] Mobile web

15. **API access for external developers?**
    - [ ] Yes
    - [x] No

### Security Questions
16. **2FA for user accounts?**
    - [ ] Yes, implement
    - [x] No, defer

17. **IP whitelisting for API access?**
    - [ ] Yes
    - [x] No

18. **Automated penetration testing (weekly)?**
    - [ ] Yes
    - [x] No (manual audit only)

19. **Auto-block suspicious IPs?**
    - [x] Yes
    - [ ] No

20. **Compliance certifications (SOC2, GDPR)?**
    - [ ] GDPR only
    - [ ] SOC2 only
    - [ ] Both
    - [x] Neither for MVP

---

## 📋 HOW TO MARK YOUR DECISIONS

**Simply edit this file and replace the `[ ]` with:**

| Symbol | Meaning | Example |
|--------|---------|---------|
| `[x]` or `[X]` | Checked/Yes | `- [x] Feature` |
| `[ ]` | Unchecked/No | `- [ ] Feature` |

**For radio buttons (single choice questions), add `x` inside your choice:**

```markdown
- [x] X only          <-- Your pick
- [ ] Both X and LinkedIn
```

---

*Edit this file to make your decisions, then save it!*
