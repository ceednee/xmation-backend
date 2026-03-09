/**
 * Timeline Entries Extractor
 * 
 * Low-level utilities for extracting entries from timeline instructions.
 * Used by higher-level timeline extractors.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Find entries by instruction type
 * const entries = findEntriesByType(instructions, "TimelineAddEntries");
 * 
 * // Get entries from a path in the document
 * const entries = getEntriesFromPath(doc, ["data", "timeline", "instructions"]);
 * ```
 */

/** Timeline instruction structure */
interface TimelineInstruction {
	type?: string;
	entries?: unknown[];
}

/**
 * Find entries by instruction type
 * 
 * @param instructions - Array of timeline instructions
 * @param targetType - Instruction type to find
 * @returns Array of entries or empty array if not found
 */
export const findEntriesByType = (
	instructions: TimelineInstruction[],
	targetType: string
): unknown[] => {
	for (const instruction of instructions) {
		if (instruction.type === targetType) {
			return Array.isArray(instruction.entries) ? instruction.entries : [];
		}
	}
	return [];
};

/**
 * Get entries from a nested path in the document
 * 
 * Navigates the object path and finds TimelineAddEntries.
 * 
 * @param doc - Document object
 * @param path - Array of keys to navigate
 * @returns Array of entries
 */
export const getEntriesFromPath = (
	doc: unknown,
	path: string[]
): unknown[] => {
	let current: unknown = doc;
	for (const key of path) {
		current = (current as any)?.[key];
		if (!current) return [];
	}
	const instructions = current as TimelineInstruction[];
	if (!Array.isArray(instructions)) return [];
	return findEntriesByType(instructions, "TimelineAddEntries");
};
