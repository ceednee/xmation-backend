/**
 * X User API Types
 * 
 * Type definitions for X (Twitter) user-related API operations.
 * Includes methods for following, blocking, listing, and reporting users.
 */

import type { XApiResponse, PaginationOptions } from "./x-api-base";

/**
 * X User API interface
 * 
 * Provides methods for all user-related operations.
 * 
 * ## Usage
 * ```typescript
 * const client: XUserApi = createXClient();
 * 
 * // Follow a user
 * await client.followUser("12345");
 * 
	// Get followers
 * const followers = await client.getFollowers("myUserId");
 * 
	// Block a user
 * await client.blockUser("12345");
 * ```
 */
export interface XUserApi {
	/**
	 * Follow a user
	 * 
	 * @param targetUserId - User ID to follow
	 * @returns API response with follow status
	 */
	followUser: (targetUserId: string) => Promise<XApiResponse>;

	/**
	 * Get followers of a user
	 * 
	 * @param userId - User ID to fetch followers for
	 * @param options - Pagination options
	 * @returns API response with followers list
	 */
	getFollowers: (userId: string, options?: PaginationOptions) => Promise<XApiResponse>;

	/**
	 * Get authenticated user info
	 * 
	 * @returns API response with current user details
	 */
	getAuthenticatedUser: () => Promise<XApiResponse>;

	/**
	 * Block a user
	 * 
	 * @param targetUserId - User ID to block
	 * @returns API response with block status
	 */
	blockUser: (targetUserId: string) => Promise<XApiResponse>;

	/**
	 * Add a user to a list
	 * 
	 * @param listId - ID of the list
	 * @param userId - User ID to add
	 * @returns API response with addition status
	 */
	addToList: (listId: string, userId: string) => Promise<XApiResponse>;

	/**
	 * Report a user for spam
	 * 
	 * @param userId - User ID to report
	 * @param reason - Reason for the report
	 * @returns API response with report status
	 */
	reportSpam: (userId: string, reason: string) => Promise<XApiResponse>;
}
