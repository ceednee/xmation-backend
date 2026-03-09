import { config } from "../../config/env";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

export const removeWorkflow = async (id: string) => {
	try {
		if (config.IS_TEST) {
			return createSuccessResponse({ message: "Workflow deleted" });
		}

		const convex = getConvexClient();
		await convex.mutation(api.workflows.remove, { id: id as any });

		return createSuccessResponse({ message: "Workflow deleted" });
	} catch (error) {
		if (error instanceof Error && error.message.includes("not found")) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		console.error("Failed to delete workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to delete workflow"), status: 500 };
	}
};
