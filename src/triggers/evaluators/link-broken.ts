/**
 * Trigger Evaluator: LINK_BROKEN
 * 
 * Detects broken links (HTTP 400+ status) in user bio or posts.
 * Helps maintain link integrity and user experience.
 * 
 * ## Configuration
 * No configuration options
 * 
 * ## Trigger Data
 * - `links` - Array of links with status codes from link checker
 * 
 * ## Returns
 * - `triggered` - True if any links have status >= 400
 * - `data.brokenLinks` - Array of broken link objects
 * - `data.count` - Number of broken links
 * - `data.locations` - Where broken links were found ("bio" | "post")
 */

import type { TriggerEvaluator } from "../types";
import { createResult } from "./result";

/**
 * Evaluates LINK_BROKEN trigger
 * Checks for links with HTTP error status codes (400+)
 */
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
