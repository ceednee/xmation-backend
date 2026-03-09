/**
 * Social API Endpoints
 * 
 * X social graph API endpoints (mentions, followers, following, retweets).
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get mentions
 * const mentions = await getMentions("20");
 * 
 * // Get followers
 * const followers = await getFollowers("userId", "50");
 * 
 * // Get following
 * const following = await getFollowing("userId", "50");
 * 
 * // Get retweets
 * const retweets = await getRetweets("tweetId", "40");
 * ```
 */

import { rapidApiRequest } from "./request";
import type {
	RapidApiFollowersResponse,
	RapidApiMentionsResponse,
	RapidApiRetweetsResponse,
} from "../../types/rapidapi";

/**
 * Get mentions for the authenticated user
 * 
 * @param count - Number of mentions to fetch (default: "20")
 * @returns Mentions response
 */
export const getMentions = (count = "20"): Promise<RapidApiMentionsResponse> =>
	rapidApiRequest<RapidApiMentionsResponse>("/mentions", { count });

/**
 * Get followers for a user
 * 
 * @param userId - User ID to get followers for
 * @param count - Number of followers to fetch (default: "50")
 * @returns Followers response
 */
export const getFollowers = (userId: string, count = "50"): Promise<RapidApiFollowersResponse> =>
	rapidApiRequest<RapidApiFollowersResponse>("/followers", { userId, count });

/**
 * Get users a user is following
 * 
 * @param userId - User ID to get following for
 * @param count - Number of users to fetch (default: "50")
 * @returns Following response
 */
export const getFollowing = (userId: string, count = "50"): Promise<RapidApiFollowersResponse> =>
	rapidApiRequest<RapidApiFollowersResponse>("/following", { userId, count });

/**
 * Get retweets for a tweet
 * 
 * @param tweetId - Tweet ID to get retweets for
 * @param count - Number of retweets to fetch (default: "40")
 * @returns Retweets response
 */
export const getRetweets = (tweetId: string, count = "40"): Promise<RapidApiRetweetsResponse> =>
	rapidApiRequest<RapidApiRetweetsResponse>("/retweets", { pid: tweetId, count });
