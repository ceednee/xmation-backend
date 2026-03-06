// RapidAPI Client - X API Integration
// Uses RAPIDAPI_KEY from environment variables

import { config } from "../config/env";
import type {
  RapidApiUserResponse,
  RapidApiMentionsResponse,
  RapidApiFollowersResponse,
  RapidApiRetweetsResponse,
} from "../types/rapidapi";

const RAPIDAPI_HOST = "twitter241.p.rapidapi.com";
const BASE_URL = `https://${RAPIDAPI_HOST}`;

// Rate limit tracking
interface RateLimitStatus {
  remaining: number;
  resetTime: number;
  limit: number;
}

let rateLimitStatus: RateLimitStatus = {
  remaining: 100,
  resetTime: Date.now() + 60000,
  limit: 100,
};

/**
 * Make authenticated request to RapidAPI
 */
async function rapidApiRequest<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  // Check rate limit
  if (rateLimitStatus.remaining <= 0) {
    const waitTime = rateLimitStatus.resetTime - Date.now();
    if (waitTime > 0) {
      console.warn(`Rate limit hit, waiting ${Math.ceil(waitTime / 1000)}s`);
      await new Promise((resolve) => setTimeout(resolve, Math.min(waitTime, 60000)));
    }
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": config.RAPIDAPI_KEY,
      Accept: "application/json",
    },
  });

  // Update rate limit tracking from headers
  const remaining = response.headers.get("x-ratelimit-requests-remaining");
  const reset = response.headers.get("x-ratelimit-requests-reset");
  if (remaining) {
    rateLimitStatus.remaining = parseInt(remaining, 10);
  }
  if (reset) {
    rateLimitStatus.resetTime = parseInt(reset, 10) * 1000;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `RapidAPI error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Get user profile by screen name
 */
export async function getUserByScreenName(
  screenName: string
): Promise<RapidApiUserResponse> {
  return rapidApiRequest<RapidApiUserResponse>("/user", {
    username: screenName,
  });
}

/**
 * Get user profile by ID
 */
export async function getUserById(userId: string): Promise<RapidApiUserResponse> {
  return rapidApiRequest<RapidApiUserResponse>("/user", {
    id: userId,
  });
}

/**
 * Get user timeline (tweets)
 */
export async function getUserTimeline(
  screenName: string,
  count: string = "20"
): Promise<any> {
  return rapidApiRequest("/user-tweets", {
    username: screenName,
    count,
  });
}

/**
 * Get mentions for a user
 */
export async function getMentions(
  count: string = "20"
): Promise<RapidApiMentionsResponse> {
  return rapidApiRequest<RapidApiMentionsResponse>("/mentions", {
    count,
  });
}

/**
 * Get followers list
 */
export async function getFollowers(
  userId: string,
  count: string = "50"
): Promise<RapidApiFollowersResponse> {
  return rapidApiRequest<RapidApiFollowersResponse>("/followers", {
    userId,
    count,
  });
}

/**
 * Get following list
 */
export async function getFollowing(
  userId: string,
  count: string = "50"
): Promise<RapidApiFollowersResponse> {
  return rapidApiRequest<RapidApiFollowersResponse>("/following", {
    userId,
    count,
  });
}

/**
 * Get retweets for a tweet
 */
export async function getRetweets(
  tweetId: string,
  count: string = "40"
): Promise<RapidApiRetweetsResponse> {
  return rapidApiRequest<RapidApiRetweetsResponse>("/retweets", {
    pid: tweetId,
    count,
  });
}

/**
 * Get tweet details
 */
export async function getTweet(tweetId: string): Promise<any> {
  return rapidApiRequest("/tweet-v2", {
    pid: tweetId,
  });
}

/**
 * Get replies to a tweet
 */
export async function getReplies(
  tweetId: string,
  count: string = "20"
): Promise<any> {
  return rapidApiRequest("/comments-v2", {
    pid: tweetId,
    count,
    rankingMode: "Relevance",
  });
}

/**
 * Search tweets
 */
export async function searchTweets(
  query: string,
  count: string = "20",
  type: string = "Latest"
): Promise<any> {
  return rapidApiRequest("/search-v2", {
    q: query,
    count,
    type,
  });
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(): RateLimitStatus {
  return { ...rateLimitStatus };
}

/**
 * Check if we can make requests
 */
export function canMakeRequest(): boolean {
  return rateLimitStatus.remaining > 0 || Date.now() >= rateLimitStatus.resetTime;
}

/**
 * Wait for rate limit reset if needed
 */
export async function waitForRateLimit(): Promise<void> {
  if (rateLimitStatus.remaining > 0) return;

  const waitTime = rateLimitStatus.resetTime - Date.now();
  if (waitTime > 0) {
    console.log(`Waiting ${Math.ceil(waitTime / 1000)}s for rate limit reset...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
}
