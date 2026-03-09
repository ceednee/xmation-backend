import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const highEngagementEvaluator: TriggerEvaluator = (config, context) => {
	const threshold = Number(config.threshold) || 100;
	const timeWindow = Number(config.timeWindow) || 3600000;
	const posts = context.posts || [];

	const recentPosts = posts.filter(
		(p) =>
			p.createdAt > (context.currentTime || Date.now()) - timeWindow &&
			p.likes + p.replies + p.retweets > threshold,
	);

	if (recentPosts.length === 0) {
		return createResult(false, "HIGH_ENGAGEMENT");
	}

	const topPost = recentPosts.sort(
		(a, b) =>
			b.likes + b.replies + b.retweets - (a.likes + a.replies + a.retweets),
	)[0];

	return createResult(true, "HIGH_ENGAGEMENT", {
		posts: recentPosts,
		topPost,
		engagement: topPost.likes + topPost.replies + topPost.retweets,
		threshold,
	});
};
