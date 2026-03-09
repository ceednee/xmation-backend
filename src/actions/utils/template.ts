/**
 * Template Variable Utilities
 * 
 * Provides template variable substitution for dynamic action content.
 * Supports referencing trigger data fields using {{fieldName}} syntax.
 * 
 * ## Supported Variables
 * - `{{authorUsername}}` - Sanitized username from trigger data
 * - `{{followerUsername}}` - Sanitized follower username
 * - `{{anyTriggerField}}` - Any field from triggerData
 * 
 * ## Usage
 * ```typescript
 * const text = "Thanks @{{authorUsername}}!";
 * const result = replaceTemplates(text, context);
 * // Result: "Thanks @johndoe!" (if authorUsername is "johndoe")
 * ```
 */

import type { ActionContext } from "../types";
import { sanitizeXss } from "./xss";

/**
 * Replace template variables in text with values from context
 * 
 * Replaces patterns like {{fieldName}} with corresponding values from
 * triggerData. Supports special handling for usernames with XSS sanitization.
 * Unknown variables are left unchanged.
 * 
 * @param text - Text containing template variables
 * @param context - Action context with trigger data
 * @returns Text with variables replaced
 * 
 * @example
 * ```typescript
 * const context = {
 *   triggerData: { authorUsername: "johndoe", tweetId: "123" }
 * };
 * 
 * replaceTemplates("Hi @{{authorUsername}}!", context);
 * // Returns: "Hi @johndoe!"
 * 
 * replaceTemplates("Tweet: {{tweetId}}", context);
 * // Returns: "Tweet: 123"
 * 
 * replaceTemplates("Unknown: {{missing}}", context);
 * // Returns: "Unknown: {{missing}}"
 * ```
 */
export const replaceTemplates = (text: string, context: ActionContext): string => {
	return text.replace(/{{(\w+)}}/g, (match, key) => {
		const triggerData = context.triggerData as Record<string, unknown>;
		if (triggerData[key] !== undefined) {
			return String(triggerData[key]);
		}
		if (triggerData.authorUsername && key === "authorUsername") {
			return sanitizeXss(String(triggerData.authorUsername));
		}
		if (triggerData.followerUsername && key === "followerUsername") {
			return sanitizeXss(String(triggerData.followerUsername));
		}
		return match;
	});
};
