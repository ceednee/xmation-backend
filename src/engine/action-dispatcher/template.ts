export const replaceTemplateVars = (
	template: string,
	data: Record<string, unknown>
): string => {
	return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
		const value = data[key];
		return value !== undefined ? String(value) : "";
	});
};

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
