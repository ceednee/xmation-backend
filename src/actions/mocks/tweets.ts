export const createMockTweetClient = () => ({
	createTweet: async (text: string) => ({
		data: { id: `mock_tweet_${Date.now()}`, text },
	}),

	likeTweet: async (tweetId: string) => ({
		data: { liked: true, tweetId },
	}),

	retweet: async (tweetId: string) => ({
		data: { retweeted: true, tweetId },
	}),

	replyToTweet: async (tweetId: string, text: string) => ({
		data: { id: `mock_reply_${Date.now()}`, text, replyTo: tweetId },
	}),

	quoteTweet: async (tweetId: string, comment: string) => ({
		data: {
			id: `mock_quote_${Date.now()}`,
			text: comment,
			quoteOf: tweetId,
		},
	}),

	pinTweet: async (tweetId: string) => ({
		pinned: true,
		tweetId,
	}),

	getUserTweets: async () => ({
		data: [],
		meta: {},
	}),
});
