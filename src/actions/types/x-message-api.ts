/**
 * X Message API Types
 * 
 * Type definitions for X (Twitter) direct message and mention API operations.
 * Includes methods for sending DMs and retrieving mentions/timeline data.
 */

import type { XApiResponse, PaginationOptions } from "./x-api-base";

/**
 * X Message API interface
 * 
 * Provides methods for direct messaging and retrieving mentions.
 * 
 * ## Usage
 * ```typescript
 * const client: XMessageApi = createXClient();
 * 
 * // Send a DM
 * await client.sendDM("12345", "Hello there!");
 * 
 * // Get mentions
 * const mentions = await client.getMentions("myUserId");
 * ```
 */
export interface XMessageApi {
	/**
	 * Send a direct message to a user
	 * 
	 * @param userId - Recipient user ID
	 * @param text - Message text content
	 * @returns API response with sent DM details
	 */
	sendDM: (userId: string, text: string) => Promise<XApiResponse>;

	/**
	 * Get mentions for a user
	 * 
	 * @param userId - User ID to fetch mentions for
	 * @param options - Pagination options
	 * @returns API response with mentions list
	 */
	getMentions: (userId: string, options?: PaginationOptions) => Promise<XApiResponse>;

	/**
	 * Get tweets from a user's timeline
	 * 
	 * @param userId - User ID to fetch tweets for
	 * @param options - Pagination options
	 * @returns API response with tweets list
	 */
	getUserTweets: (userId: string, options?: PaginationOptions) => Promise<XApiResponse>;
}
