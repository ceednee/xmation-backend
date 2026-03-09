/**
 * X API Client Type
 * 
 * Defines the complete X (Twitter) API client interface by combining
 * all individual API modules: tweets, users, and messages.
 * 
 * This is the main type used by action executors to interact with X.
 * 
 * ## Usage
 * ```typescript
 * import type { XApiClient } from "./types";
 * 
 * async function performAction(client: XApiClient) {
 *   await client.createTweet("Hello world!");
 *   await client.followUser("12345");
 *   await client.sendDM("12345", "Hello!");
 * }
 * ```
 */

import type { XTweetApi } from "./x-tweet-api";
import type { XUserApi } from "./x-user-api";
import type { XMessageApi } from "./x-message-api";

/**
 * Complete X API client interface
 * 
 * Combines all API modules into a single interface for use by action executors.
 */
export interface XApiClient extends XTweetApi, XUserApi, XMessageApi {}
