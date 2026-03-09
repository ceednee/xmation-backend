import { type Context, Elysia, t } from "elysia";
import * as syncService from "../services/sync-service";

// Placeholder user ID for auth-less mode
const PLACEHOLDER_USER_ID = "user_placeholder";

export const syncRoutes = new Elysia({ prefix: "/sync" })
	// GET /sync/status - Get sync status
	.get("/status", async () => {
		const userId = PLACEHOLDER_USER_ID;
		const status = await syncService.getSyncStatus(userId);

		return {
			success: true,
			data: status,
		};
	})

	// POST /sync/mentions - Sync mentions
	.post(
		"/mentions",
		async ({
			body,
		}: Context & { body: { sinceId?: string } | null }) => {
			const userId = PLACEHOLDER_USER_ID;
			const sinceId = body?.sinceId;

			const mentions = await syncService.syncMentions(userId, sinceId);

			return {
				success: true,
				data: {
					mentions,
					count: mentions.length,
				},
			};
		},
		{
			body: t.Optional(
				t.Object({
					sinceId: t.Optional(t.String()),
				}),
			),
		},
	)

	// POST /sync/followers - Sync followers
	.post(
		"/followers",
		async ({
			body,
		}: Context & { body: { xUserId?: string } | null }) => {
			const userId = PLACEHOLDER_USER_ID;
			const xUserId = body?.xUserId;

			if (!xUserId) {
				return {
					success: false,
					error: { code: "NO_X_USER", message: "X user ID required" },
				};
			}

			const result = await syncService.syncFollowers(userId, xUserId);

			return {
				success: true,
				data: {
					followerCount: result.followers.length,
					newFollowers: result.newFollowers.length,
					unfollows: result.unfollows.length,
				},
			};
		},
		{
			body: t.Optional(
				t.Object({
					xUserId: t.Optional(t.String()),
				}),
			),
		},
	)

	// POST /sync/timeline - Sync timeline
	.post(
		"/timeline",
		async ({
			body,
		}: Context & { body: { screenName?: string } | null }) => {
			const userId = PLACEHOLDER_USER_ID;
			const screenName = body?.screenName;

			if (!screenName) {
				return {
					success: false,
					error: { code: "NO_SCREEN_NAME", message: "Screen name required" },
				};
			}

			const result = await syncService.syncTimeline(userId, screenName);

			return {
				success: true,
				data: {
					tweetCount: result.tweets.length,
					lastPostTime: result.lastPostTime,
					hoursSinceLastPost: result.lastPostTime
						? Math.floor((Date.now() - result.lastPostTime) / (1000 * 60 * 60))
						: null,
				},
			};
		},
		{
			body: t.Optional(
				t.Object({
					screenName: t.Optional(t.String()),
				}),
			),
		},
	)

	// POST /sync/full - Full sync
	.post(
		"/full",
		async ({
			body,
		}: Context & {
			body: { xUserId?: string; screenName?: string } | null;
		}) => {
			const userId = PLACEHOLDER_USER_ID;
			const xUserId = body?.xUserId;
			const screenName = body?.screenName;

			if (!xUserId || !screenName) {
				return {
					success: false,
					error: {
						code: "MISSING_CREDENTIALS",
						message: "X user ID and screen name required",
					},
				};
			}

			const result = await syncService.fullSync(userId, xUserId, screenName);

			return {
				success: true,
				data: {
					userSynced: !!result.user,
					mentionCount: result.mentions.length,
					followerCount: result.followers.followers.length,
					newFollowers: result.followers.newFollowers.length,
					unfollows: result.followers.unfollows.length,
					tweetCount: result.timeline.tweets.length,
					lastPostTime: result.timeline.lastPostTime,
				},
			};
		},
		{
			body: t.Optional(
				t.Object({
					xUserId: t.Optional(t.String()),
					screenName: t.Optional(t.String()),
				}),
			),
		},
	);

export default syncRoutes;
