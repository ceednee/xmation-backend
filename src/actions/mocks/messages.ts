/**
 * X Message API Mock
 * 
 * Mock implementation of X (Twitter) direct message and mention API operations.
 * Used for testing and dry-run mode without making actual API calls.
 */

/**
 * Creates a mock X message API client
 * 
 * Provides mock implementations for:
 * - Sending direct messages
 * - Fetching mentions
 * - Getting user tweets
 * 
 * @returns Mock message API client object
 * 
 * @example
 * ```typescript
 * const client = createMockMessageClient();
 * 
 * // Mock sending a DM
 * const dm = await client.sendDM("12345", "Hello!");
 * // Returns: { data: { id: "mock_dm_1234567890", text: "Hello!", recipientId: "12345" } }
 * 
 * // Mock getting mentions
 * const mentions = await client.getMentions("myUserId");
 * // Returns: { data: [], meta: {} }
 * ```
 */
export const createMockMessageClient = () => ({
	/**
	 * Mock send direct message
	 * @param userId - Recipient user ID
	 * @param text - Message text
	 * @returns Mock DM response
	 */
	sendDM: async (userId: string, text: string) => ({
		data: { id: `mock_dm_${Date.now()}`, text, recipientId: userId },
	}),

	/**
	 * Mock get mentions
	 * @returns Empty mentions list
	 */
	getMentions: async () => ({
		data: [],
		meta: {},
	}),

	/**
	 * Mock get user tweets
	 * @returns Empty tweets list
	 */
	getUserTweets: async () => ({
		data: [],
		meta: {},
	}),
});
