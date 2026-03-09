interface TimelineInstruction {
	type?: string;
	entries?: unknown[];
}

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
