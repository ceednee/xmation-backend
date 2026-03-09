import { syncService } from "./service";

export async function syncMentions(
	userId: string,
	sinceId?: string
): Promise<Array<{ id: string; text: string; createdAt: number }>> {
	const result = await syncService.syncMentions(userId, userId, { sinceId });
	return (result.mentions as Array<{ id: string; text: string; createdAt: number }>) || [];
}

export async function syncFollowers(
	userId: string,
	xUserId: string
): Promise<{
	followers: Array<{ id: string; username: string }>;
	newFollowers: Array<{ id: string; username: string }>;
	unfollows: Array<{ id: string; username: string }>;
}> {
	const result = await syncService.syncFollowers(userId, xUserId);
	return {
		followers: (result.newFollowers as Array<{ id: string; username: string }>) || [],
		newFollowers: (result.newFollowers as Array<{ id: string; username: string }>) || [],
		unfollows: [],
	};
}

export async function syncTimeline(
	userId: string,
	_screenName: string
): Promise<{
	tweets: Array<{ id: string; text: string; createdAt: number }>;
	lastPostTime: number | null;
}> {
	const result = await syncService.syncPosts(userId, userId);
	const posts = (result.posts as Array<{ id: string; text: string; createdAt: number }>) || [];
	const lastPostTime = posts.length > 0 ? Math.max(...posts.map(p => p.createdAt)) : null;

	return { tweets: posts, lastPostTime };
}

export async function fullSync(
	userId: string,
	xUserId: string,
	screenName: string
): Promise<{
	user: boolean;
	mentions: Array<unknown>;
	followers: {
		followers: Array<unknown>;
		newFollowers: Array<unknown>;
		unfollows: Array<unknown>;
	};
	timeline: {
		tweets: Array<unknown>;
		lastPostTime: number | null;
	};
}> {
	const [mentionsResult, followersResult, timelineResult] = await Promise.all([
		syncMentions(userId),
		syncFollowers(userId, xUserId),
		syncTimeline(userId, screenName),
	]);

	return {
		user: true,
		mentions: mentionsResult,
		followers: followersResult,
		timeline: timelineResult,
	};
}
