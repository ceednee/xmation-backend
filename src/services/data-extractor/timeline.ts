import type { TimelineInstruction } from "../../types/rapidapi";

export const getTimelineEntries = (instructions: TimelineInstruction[]): unknown[] => {
	for (const instruction of instructions) {
		if (instruction.type === "TimelineAddEntries") {
			return instruction.entries || [];
		}
	}
	return [];
};
