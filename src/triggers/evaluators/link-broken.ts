import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

export const linkBrokenEvaluator: TriggerEvaluator = (_config, context) => {
	const links = context.links || [];
	const brokenLinks = links.filter((link) => link.status >= 400);

	if (brokenLinks.length === 0) {
		return createResult(false, "LINK_BROKEN");
	}

	return createResult(true, "LINK_BROKEN", {
		brokenLinks,
		count: brokenLinks.length,
		locations: brokenLinks.map((l) => l.location),
	});
};
