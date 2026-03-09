/**
 * Users API Endpoints
 * 
 * X user-related API endpoints.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get user by screen name
 * const user = await getUserByScreenName("example_user");
 * 
 * // Get user by ID
 * const user = await getUserById("123456");
 * 
 * // Get user's timeline/tweets
 * const timeline = await getUserTimeline("example_user", "20");
 * ```
 */

import { rapidApiRequest } from "./request";
import type { RapidApiUserResponse } from "../../types/rapidapi";

/**
 * Get user by screen name (handle)
 * 
 * @param screenName - User's screen name (without @)
 * @returns User data
 */
export const getUserByScreenName = (screenName: string): Promise<RapidApiUserResponse> =>
	rapidApiRequest<RapidApiUserResponse>("/user", { username: screenName });

/**
 * Get user by ID
 * 
 * @param userId - User's numeric ID
 * @returns User data
 */
export const getUserById = (userId: string): Promise<RapidApiUserResponse> =>
	rapidApiRequest<RapidApiUserResponse>("/user", { id: userId });

/**
 * Get a user's timeline/tweets
 * 
 * @param screenName - User's screen name
 * @param count - Number of tweets to fetch (default: "20")
 * @returns Timeline data
 */
export const getUserTimeline = (screenName: string, count = "20"): Promise<unknown> =>
	rapidApiRequest("/user-tweets", { username: screenName, count });
