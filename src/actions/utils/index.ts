/**
 * Action Utilities Module
 * 
 * Provides shared utility functions used by action executors:
 * - Result creation helpers
 * - Template variable replacement
 * - XSS sanitization for security
 * 
 * ## Usage
 * ```typescript
 * import { createResult, replaceTemplates, sanitizeXss } from "./utils";
 * 
 * // Create an action result
 * const result = createResult(true, "ACTION_TYPE", 100, { data: "value" });
 * 
 * // Replace template variables
 * const text = replaceTemplates("Hello {{name}}!", context);
 * 
 * // Sanitize user input
 * const clean = sanitizeXss(userInput);
 * ```
 */

export { createResult } from "./result";
export { replaceTemplates } from "./template";
export { sanitizeXss } from "./xss";
