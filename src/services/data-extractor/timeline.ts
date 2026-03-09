/**
 * Timeline Utilities
 * 
 * Helper functions for navigating X timeline structures.
 * 
 * ## Usage
 * 
 * ```typescript
 * // Get timeline entries from instructions
 * const entries = getTimelineEntries(response.data.timeline.instructions);
 * ```
 */

import type { TimelineInstruction } from "../../types/rapidapi";

/**
 * Get entries from timeline instructions
 * 
 * Extracts entries from TimelineAddEntries instruction type.
 * 
 * @param instructions - Timeline instructions array
 * @returns Array of timeline entries
 */
export const getTimelineEntries = (instructions: TimelineInstruction[]): unknown[] => {
	for (const instruction of instructions) {
		if (instruction.type === "TimelineAddEntries") {
			return instruction.entries || [];
		}
	}
	return [];
};
