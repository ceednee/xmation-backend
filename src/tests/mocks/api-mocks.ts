// Mock external API responses

// X API v2 Mocks
export const xApiMocks = {
	// Mock create tweet response
	createTweet: {
		data: {
			id: "tweet_123456789",
			text: "Test tweet content",
		},
	},

	// Mock user profile
	userProfile: {
		data: {
			id: "user_123",
			username: "testuser",
			name: "Test User",
			profile_image_url: "https://example.com/avatar.jpg",
			description: "Test bio",
			public_metrics: {
				followers_count: 1000,
				following_count: 500,
				tweet_count: 5000,
			},
			verified: true,
		},
	},

	// Mock mentions
	mentions: {
		data: [
			{
				id: "mention_1",
				text: "@testuser Great post!",
				author_id: "user_456",
				created_at: new Date().toISOString(),
			},
			{
				id: "mention_2",
				text: "@testuser Thanks for sharing",
				author_id: "user_789",
				created_at: new Date().toISOString(),
			},
		],
		meta: {
			result_count: 2,
			next_token: "abc123",
		},
	},

	// Mock followers
	followers: {
		data: [
			{ id: "follower_1", username: "follower1", name: "Follower One" },
			{ id: "follower_2", username: "follower2", name: "Follower Two" },
		],
		meta: {
			result_count: 2,
		},
	},

	// Mock OAuth tokens
	oauthTokens: {
		access_token: "access_token_123",
		refresh_token: "refresh_token_456",
		expires_in: 7200,
		token_type: "Bearer",
		scope: "tweet.read tweet.write users.read follows.read",
	},
};

// RapidAPI Mocks
export const rapidApiMocks = {
	// Mock user profile response
	userProfile: {
		data: {
			user: {
				result: {
					rest_id: "user_123",
					legacy: {
						screen_name: "testuser",
						name: "Test User",
						followers_count: 1000,
						following_count: 500,
						statuses_count: 5000,
						profile_image_url_https: "https://example.com/avatar.jpg",
						description: "Test bio",
						verified: true,
					},
				},
			},
		},
	},

	// Mock tweets response
	tweets: {
		data: [
			{
				rest_id: "tweet_1",
				legacy: {
					text: "Test tweet 1",
					created_at: "2024-01-01T00:00:00Z",
					retweet_count: 10,
					favorite_count: 50,
				},
			},
			{
				rest_id: "tweet_2",
				legacy: {
					text: "Test tweet 2",
					created_at: "2024-01-02T00:00:00Z",
					retweet_count: 5,
					favorite_count: 25,
				},
			},
		],
	},

	// Mock followers response
	followers: {
		data: {
			user: {
				result: {
					timeline: {
						timeline: {
							instructions: [
								{
									entries: [
										{
											content: {
												itemContent: {
													user_results: {
														result: {
															rest_id: "follower_1",
															legacy: {
																screen_name: "follower1",
																name: "Follower One",
															},
														},
													},
												},
											},
										},
									],
								},
							],
						},
					},
				},
			},
		},
	},

	// Mock mentions timeline
	mentions: {
		timeline: {
			instructions: [
				{
					entries: [
						{
							content: {
								itemContent: {
									tweet_results: {
										result: {
											rest_id: "mention_1",
											legacy: {
												text: "@testuser Hello!",
												created_at: "2024-01-01T00:00:00Z",
												entities: {
													user_mentions: [{ screen_name: "testuser" }],
												},
											},
										},
									},
								},
							},
						},
					],
				},
			],
		},
	},
};

// Setup fetch mock
export function setupFetchMock() {
	const originalFetch = global.fetch;

	const mockFetch = async (url: string | URL | Request, init?: RequestInit) => {
		const urlStr = url.toString();

		// X API endpoints
		if (urlStr.includes("api.twitter.com") || urlStr.includes("api.x.com")) {
			// OAuth token endpoint
			if (urlStr.includes("oauth2/token")) {
				return new Response(JSON.stringify(xApiMocks.oauthTokens), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Create tweet
			if (urlStr.includes("/tweets") && init?.method === "POST") {
				return new Response(JSON.stringify(xApiMocks.createTweet), {
					status: 201,
					headers: { "Content-Type": "application/json" },
				});
			}

			// User profile
			if (urlStr.includes("/users/me")) {
				return new Response(JSON.stringify(xApiMocks.userProfile), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Mentions
			if (urlStr.includes("/mentions")) {
				return new Response(JSON.stringify(xApiMocks.mentions), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Followers
			if (urlStr.includes("/followers")) {
				return new Response(JSON.stringify(xApiMocks.followers), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// User tweets
			if (urlStr.match(/\/users\/[^/]+\/tweets/)) {
				return new Response(JSON.stringify(xApiMocks.mentions), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Like tweet
			if (urlStr.includes("/likes") && init?.method === "POST") {
				return new Response(JSON.stringify({ data: { liked: true } }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Retweet
			if (urlStr.includes("/retweets") && init?.method === "POST") {
				return new Response(JSON.stringify({ data: { retweeted: true } }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Follow user
			if (urlStr.includes("/following") && init?.method === "POST") {
				return new Response(JSON.stringify({ data: { following: true, pending_follow: false } }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// DM conversations
			if (urlStr.includes("/dm_conversations") && init?.method === "POST") {
				return new Response(JSON.stringify({ data: { dm_conversation_id: "dm_123" } }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		// RapidAPI endpoints (twitter241.p.rapidapi.com)
		if (urlStr.includes("twitter241.p.rapidapi.com")) {
			// User by username
			if (urlStr.includes("/user") && urlStr.includes("username=")) {
				return new Response(JSON.stringify(rapidApiMocks.userProfile), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// User tweets
			if (urlStr.includes("/user-tweets")) {
				return new Response(JSON.stringify(rapidApiMocks.tweets), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Followers
			if (urlStr.includes("/followers")) {
				return new Response(JSON.stringify(rapidApiMocks.followers), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Mentions
			if (urlStr.includes("/mentions")) {
				return new Response(JSON.stringify(rapidApiMocks.mentions), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}

			// Retweets
			if (urlStr.includes("/retweets")) {
				return new Response(JSON.stringify({ data: [] }), {
					status: 200,
					headers: { "Content-Type": "application/json" },
				});
			}
		}

		// Default: return 404
		return new Response(JSON.stringify({ error: "Not Found" }), {
			status: 404,
			headers: { "Content-Type": "application/json" },
		});
	};

	// Assign mock to global.fetch with type assertion
	(global as { fetch: typeof mockFetch }).fetch = mockFetch;

	// Return cleanup function
	return () => {
		global.fetch = originalFetch;
	};
}

export function resetFetchMock() {
	// Reset to default fetch behavior if needed
}
