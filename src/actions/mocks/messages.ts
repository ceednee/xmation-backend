export const createMockMessageClient = () => ({
	sendDM: async (userId: string, text: string) => ({
		data: { id: `mock_dm_${Date.now()}`, text, recipientId: userId },
	}),

	getMentions: async () => ({
		data: [],
		meta: {},
	}),
});
