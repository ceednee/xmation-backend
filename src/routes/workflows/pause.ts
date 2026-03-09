import { config } from "../../config/env";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

export const pauseWorkflow = async (id: string) => {
	try {
		if (config.IS_TEST) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		const convex = getConvexClient();
		await convex.mutation(api.workflows.pause, { id: id as any });
		const workflow = await convex.query(api.workflows.get, { id: id as any });

		return createSuccessResponse(workflow);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("not found")) {
				return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
			}
			if (error.message.includes("not active")) {
				return { ...createErrorResponse("NOT_ACTIVE", error.message), status: 400 };
			}
		}

		console.error("Failed to pause workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to pause workflow"), status: 500 };
	}
};
