export const createMockUserClient = () => ({
	followUser: async (targetUserId: string) => ({
		data: { following: true, userId: targetUserId },
	}),

	getFollowers: async () => ({
		data: [{ id: "mock_follower", username: "mockuser" }],
		meta: {},
	}),

	getAuthenticatedUser: async () => ({
		data: { id: "mock_user", username: "mockuser" },
	}),

	blockUser: async (targetUserId: string) => ({
		data: { blocked: true, userId: targetUserId },
	}),

	addToList: async (listId: string, userId: string) => ({
		added: true,
		listId,
		userId,
	}),

	reportSpam: async (userId: string, reason: string) => ({
		reported: true,
		userId,
		reason,
	}),
});
