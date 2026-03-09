/**
 * @module cron-manager/validation
 * 
 * Cron expression validation utilities.
 * 
 * This module provides functions to validate cron expressions for correctness
 * before they are scheduled. It checks that expressions follow the standard
 * 5-field format and that each field contains valid values within appropriate
 * ranges.
 * 
 * The validator supports standard cron syntax including wildcards, ranges,
 * lists, and step values.
 * 
 * @example
 * ```typescript
 * import { validateCronExpression } from "./validation";
 * 
 * // Valid expressions
 * validateCronExpression("* /5 * * * *");    // true - every 5 minutes (space prevents comment close)
 * validateCronExpression("0 9 * * 1-5");     // true - weekdays at 9 AM
 * validateCronExpression("0,30 * * * *");    // true - every 30 minutes
 * 
 * // Invalid expressions
 * validateCronExpression("invalid");         // false
 * validateCronExpression("60 * * * *");      // false - minute out of range
 * validateCronExpression("* * * *");         // false - only 4 fields
 * ```
 */

/**
 * Regular expression patterns for validating individual cron fields.
 * 
 * Each pattern matches a different cron syntax variant:
 * - `*` or `* /n` - Wildcard with optional step (space prevents comment close)
 * - `n` - Single numeric value
 * - `n-m` - Range of values
 * - `n,m,o` - List of values
 * 
 * @private
 * @type {RegExp[]}
 */
const VALIDATION_PATTERNS = [
	/^\*(\/\d+)?$/,           // * or star/n
	/^\d+$/,                   // n
	/^\d+-\d+$/,               // n-m
	/^\d+(,\d+)*$/,            // n,m,o
];

/**
 * Checks if a single cron field part matches valid syntax patterns.
 * 
 * @private
 * @param {string} part - The cron field value to validate
 * @returns {boolean} True if the part matches any valid pattern
 */
const isValidPart = (part: string): boolean => {
	return VALIDATION_PATTERNS.some(pattern => pattern.test(part));
};

/**
 * Validation ranges for each cron field.
 * 
 * Defines the minimum and maximum valid values for each of the 5 cron fields:
 * minute (0-59), hour (0-23), day of month (1-31), month (1-12), day of week (0-6).
 * 
 * @private
 * @type {Array<{index: number, min: number, max: number}>}
 */
const VALIDATION_RANGES = [
	{ index: 0, min: 0, max: 59 },   // minute
	{ index: 1, min: 0, max: 23 },   // hour
	{ index: 2, min: 1, max: 31 },   // day of month
	{ index: 3, min: 1, max: 12 },   // month
	{ index: 4, min: 0, max: 6 },    // day of week
];

/**
 * Validates a cron expression string.
 * 
 * Checks that the expression:
 * 1. Is a non-empty string
 * 2. Contains exactly 5 space-separated fields
 * 3. Each field matches valid cron syntax patterns
 * 4. Numeric values are within valid ranges for their field
 * 
 * @export
 * @param {string} expression - The cron expression to validate
 * @returns {boolean} True if the expression is valid, false otherwise
 * @example
 * ```typescript
 * // Before scheduling, validate the expression
 * if (!validateCronExpression(interval)) {
 *   throw new Error(`Invalid cron expression: ${interval}`);
 * }
 * 
 * // Valid examples
 * validateCronExpression("0 * * * *");        // true - every hour
 * validateCronExpression("* /15 * * * *");    // true - every 15 minutes
 * validateCronExpression("0 9-17 * * 1-5");   // true - business hours on weekdays
 * 
 * // Invalid examples
 * validateCronExpression("");                 // false - empty
 * validateCronExpression("* * * *");          // false - 4 fields
 * validateCronExpression("60 25 32 13 8");    // false - values out of range
 * ```
 */
export const validateCronExpression = (expression: string): boolean => {
	if (!expression || typeof expression !== "string") {
		return false;
	}

	const parts = expression.trim().split(/\s+/);
	if (parts.length !== 5) {
		return false;
	}

	for (const { index, min, max } of VALIDATION_RANGES) {
		const part = parts[index];
		if (!isValidPart(part)) return false;
		if (/^\d+$/.test(part)) {
			const value = parseInt(part);
			if (value < min || value > max) return false;
		}
	}

	return true;
};
