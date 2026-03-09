import { config } from "../../config/env";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

export const activateWorkflow = async (id: string) => {
	try {
		if (config.IS_TEST) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		const convex = getConvexClient();
		await convex.mutation(api.workflows.activate, { id: id as any });
		const workflow = await convex.query(api.workflows.get, { id: id as any });

		return createSuccessResponse(workflow);
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.includes("not found")) {
				return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
			}
			if (error.message.includes("trigger")) {
				return { ...createErrorResponse("NO_TRIGGERS", error.message), status: 400 };
			}
		}

		console.error("Failed to activate workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to activate workflow"), status: 500 };
	}
};
