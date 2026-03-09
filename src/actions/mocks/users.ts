/**
 * X User API Mock
 * 
 * Mock implementation of X (Twitter) user-related API operations.
 * Used for testing and dry-run mode without making actual API calls.
 */

/**
 * Creates a mock X user API client
 * 
 * Provides mock implementations for:
 * - Following users
 * - Getting followers
 * - Getting authenticated user info
 * - Blocking users
 * - Adding users to lists
 * - Reporting spam
 * 
 * @returns Mock user API client object
 * 
 * @example
 * ```typescript
 * const client = createMockUserClient();
 * 
 * // Mock following a user
 * const result = await client.followUser("12345");
 * // Returns: { data: { following: true, userId: "12345" } }
 * 
 * // Mock getting followers
 * const followers = await client.getFollowers("myUserId");
 * // Returns: { data: [{ id: "mock_follower", username: "mockuser" }], meta: {} }
 * ```
 */
export const createMockUserClient = () => ({
	/**
	 * Mock follow user
	 * @param targetUserId - User ID to follow
	 * @returns Mock follow response
	 */
	followUser: async (targetUserId: string) => ({
		data: { following: true, userId: targetUserId },
	}),

	/**
	 * Mock get followers
	 * @returns Mock followers list
	 */
	getFollowers: async () => ({
		data: [{ id: "mock_follower", username: "mockuser" }],
		meta: {},
	}),

	/**
	 * Mock get authenticated user
	 * @returns Mock user info
	 */
	getAuthenticatedUser: async () => ({
		data: { id: "mock_user", username: "mockuser" },
	}),

	/**
	 * Mock block user
	 * @param targetUserId - User ID to block
	 * @returns Mock block response
	 */
	blockUser: async (targetUserId: string) => ({
		data: { blocked: true, userId: targetUserId },
	}),

	/**
	 * Mock add user to list
	 * @param listId - List ID
	 * @param userId - User ID to add
	 * @returns Mock add to list response
	 */
	addToList: async (listId: string, userId: string) => ({
		added: true,
		listId,
		userId,
	}),

	/**
	 * Mock report spam
	 * @param userId - User ID to report
	 * @param reason - Report reason
	 * @returns Mock report response
	 */
	reportSpam: async (userId: string, reason: string) => ({
		reported: true,
		userId,
		reason,
	}),
});
