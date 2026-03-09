/**
 * Template Variable Processing
 * 
 * Provides utilities for replacing template variables in action configurations.
 * Supports {{variable}} syntax for dynamic value substitution.
 * 
 * @module action-dispatcher/template
 */

/**
 * Replace template variables in a string with values from data.
 * 
 * Template variables use the syntax {{variableName}} and are replaced
 * with corresponding values from the data object. If a variable is
 * not found in the data, it is replaced with an empty string.
 * 
 * @param template - The template string containing {{variable}} placeholders
 * @param data - Object containing values to substitute
 * @returns The string with all template variables replaced
 * 
 * @example
 * ```typescript
 * const result = replaceTemplateVars("Hello {{name}}!", { name: "World" });
 * // result: "Hello World!"
 * 
 * const result2 = replaceTemplateVars("User: {{user}}, ID: {{id}}", { user: "John" });
 * // result2: "User: John, ID: "
 * ```
 */
export const replaceTemplateVars = (
	template: string,
	data: Record<string, unknown>
): string => {
	return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
		const value = data[key];
		return value !== undefined ? String(value) : "";
	});
};

/**
 * Recursively substitute template variables in a configuration object.
 * 
 * Processes all string values in the config object, replacing template
 * variables with values from triggerData. Nested objects are processed
 * recursively.
 * 
 * @param config - Configuration object containing template variables
 * @param triggerData - Data from the trigger event to use for substitution
 * @returns A new config object with all template variables replaced
 * 
 * @example
 * ```typescript
 * const config = {
 *   message: "Hello {{name}}!",
 *   nested: {
 *     text: "ID: {{id}}"
 *   }
 * };
 * const data = { name: "John", id: "123" };
 * const result = substituteTemplates(config, data);
 * // result: { message: "Hello John!", nested: { text: "ID: 123" } }
 * ```
 */
export const substituteTemplates = (
	config: Record<string, unknown>,
	triggerData: Record<string, unknown>
): Record<string, unknown> => {
	const result: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(config)) {
		if (typeof value === "string") {
			result[key] = replaceTemplateVars(value, triggerData);
		} else if (typeof value === "object" && value !== null) {
			result[key] = substituteTemplates(
				value as Record<string, unknown>,
				triggerData
			);
		} else {
			result[key] = value;
		}
	}

	return result;
};
