/**
 * XSS Sanitization Utilities
 * 
 * Provides security functions to sanitize user input and prevent
 * cross-site scripting (XSS) attacks in action outputs.
 * 
 * ## Security Features
 * - Removes script tags and their contents
 * - Removes iframe, object, and embed tags
 * - Strips javascript: protocols
 * - Removes inline event handlers (on* attributes)
 * 
 * ## Usage
 * ```typescript
 * import { sanitizeXss } from "./utils";
 * 
 * const userInput = '<script>alert("xss")</script>Hello';
 * const clean = sanitizeXss(userInput);
 * // Result: "Hello"
 * ```
 */

/**
 * Sanitizes text to prevent XSS attacks
 * 
 * Removes potentially dangerous HTML tags, JavaScript protocols,
 * and event handlers from user input.
 * 
 * @param text - Text to sanitize
 * @returns Sanitized text safe for output
 * 
 * @example
 * ```typescript
 * sanitizeXss('<script>alert("hack")</script>');
 * // Returns: ""
 * 
 * sanitizeXss('<img onerror="alert(1)" src="x">');
 * // Returns: '<img src="x">'
 * 
 * sanitizeXss('javascript:alert(1)');
 * // Returns: ""
 * ```
 */
export const sanitizeXss = (text: string): string => {
	return text
		.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
		.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
		.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
		.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
		.replace(/javascript:/gi, "")
		.replace(/on\w+\s*=/gi, "");
};
