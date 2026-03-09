import { config } from "../../config/env";
import type { UpdateWorkflowBody } from "./types";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

export const updateWorkflow = async (id: string, body: UpdateWorkflowBody) => {
	try {
		if (config.IS_TEST) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		const convex = getConvexClient();
		await convex.mutation(api.workflows.update, {
			id: id as any,
			...(body.name !== undefined && { name: body.name }),
			...(body.description !== undefined && { description: body.description }),
			...(body.isDryRun !== undefined && { isDryRun: body.isDryRun }),
		});

		const workflow = await convex.query(api.workflows.get, { id: id as any });
		return createSuccessResponse(workflow);
	} catch (error) {
		if (error instanceof Error && error.message.includes("not found")) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		console.error("Failed to update workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to update workflow"), status: 500 };
	}
};
