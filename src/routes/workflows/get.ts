import { config } from "../../config/env";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

export const getWorkflow = async (id: string) => {
	try {
		if (config.IS_TEST) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		const convex = getConvexClient();
		const workflow = await convex.query(api.workflows.get, { id: id as any });

		if (!workflow) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		return createSuccessResponse(workflow);
	} catch (error) {
		console.error("Failed to get workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to fetch workflow"), status: 500 };
	}
};
