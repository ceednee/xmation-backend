import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const newReplyEvaluator: TriggerEvaluator = (_config, context) => {
	const replies = context.replies || [];
	const newReplies = replies.filter(
		(r) => r.createdAt > (context.currentTime || Date.now()) - 60000,
	);

	if (newReplies.length === 0) {
		return createResult(false, "NEW_REPLY");
	}

	return createResult(true, "NEW_REPLY", {
		replies: newReplies,
		count: newReplies.length,
		latestReply: newReplies[0],
	});
};
