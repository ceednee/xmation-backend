/**
 * X API Mock Client
 * 
 * Provides a mock implementation of the X (Twitter) API client for testing
 * and development. Simulates API responses without making actual network requests.
 * 
 * ## Features
 * - Returns realistic mock data structures
 * - Generates unique IDs using timestamps
 * - Safe for use in dry-run mode and testing
 * - Implements all XApiClient methods
 * 
 * ## Usage
 * ```typescript
 * import { createMockXClient } from "./mocks";
 * 
 * const client = createMockXClient();
 * 
 * // Mock tweet creation
 * const tweet = await client.createTweet("Hello world!");
 * // Returns: { data: { id: "mock_tweet_1234567890", text: "Hello world!" } }
 * 
 * // Mock user following
 * const result = await client.followUser("12345");
 * // Returns: { data: { following: true, userId: "12345" } }
 * ```
 */

import type { XApiClient } from "../types";
import { createMockTweetClient } from "./tweets";
import { createMockUserClient } from "./users";
import { createMockMessageClient } from "./messages";

/**
 * Creates a complete mock X API client
 * 
 * Combines mock implementations for tweets, users, and messages
 * into a single client that implements the XApiClient interface.
 * 
 * @returns Mock X API client instance
 */
export const createMockXClient = (): XApiClient => ({
	...createMockTweetClient(),
	...createMockUserClient(),
	...createMockMessageClient(),
});
