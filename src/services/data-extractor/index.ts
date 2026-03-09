/**
 * Data Extractor Module
 * 
 * Extracts and transforms X (Twitter) API data into clean, typed structures.
 * Handles various entity types: users, tweets, mentions, followers, etc.
 * 
 * ## Key Concepts
 * 
 * - **Entity Extraction**: Extract specific entities from API responses
 * - **Data Transformation**: Convert API format to internal format
 * - **Engagement Calculation**: Compute engagement metrics
 * - **Sentiment Analysis**: Basic sentiment scoring
 * 
 * ## Entity Types
 * 
 * - **Users**: Profile data, follower counts, verification status
 * - **Tweets**: Content, engagement stats, media
 * - **Mentions**: Tweets mentioning the user
 * - **Followers**: Follower relationships and metadata
 * - **Retweets**: Retweet data and attribution
 * 
 * ## Module Structure
 * 
 * - `user.ts` - User profile extraction
 * - `tweet.ts` - Tweet extraction and normalization
 * - `mention.ts` - Mention processing
 * - `follower.ts` - Follower data extraction
 * - `retweet.ts` - Retweet processing
 * - `engagement.ts` - Engagement metric calculation
 * - `entities.ts` - Entity extraction (hashtags, mentions, URLs)
 * - `sentiment.ts` - Basic sentiment analysis (detectNegativeSentiment)
 * - `timeline.ts` - Timeline navigation
 * - `follower-utils.ts` - Follower detection utilities
 * - `time.ts` - Time parsing utilities
 * 
 * ## Usage
 * 
 * ```typescript
 * // Extract user from API response
 * const user = extractUser(apiResponse);
 * 
 * // Extract tweets from timeline
 * const tweets = extractTweets(timelineResponse);
 * 
 * // Calculate engagement rate
 * const rate = calculateEngagement(tweet);
 * 
 * // Extract mentions
 * const mentions = extractMentions(mentionsResponse);
 * 
 * // Detect sentiment
 * const isNegative = detectNegativeSentiment(text);
 * 
 * // Detect new followers
 * const newFollowers = detectNewFollowers(previousFollowers, currentFollowers);
 * ```
 */

export { extractUser } from "./user";
export { extractTweet, extractTweets } from "./tweet";
export { extractMentions } from "./mention";
export { extractFollowers } from "./follower";
export { extractRetweets } from "./retweet";
export { calculateEngagement, findLastPostTime } from "./engagement";
export { extractEntities, extractHashtags, extractMentions as extractMentionEntities } from "./entities";
export { detectNegativeSentiment } from "./sentiment";
export { detectUnfollows, detectNewFollowers } from "./follower-utils";
export { parseTimeString } from "./time";
