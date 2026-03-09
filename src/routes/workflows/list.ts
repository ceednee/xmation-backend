import { config } from "../../config/env";
import type { Workflow } from "../../types";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

export const listWorkflows = async (status?: string) => {
	try {
		if (config.IS_TEST) {
			return createSuccessResponse({
				data: [],
				meta: { total: 0 },
			});
		}

		const convex = getConvexClient();
		const workflows = await convex.query(api.workflows.list, {});

		const filteredWorkflows = status
			? workflows.filter((w: Workflow) => w.status === status)
			: workflows;

		return createSuccessResponse({
			data: filteredWorkflows,
			meta: { total: filteredWorkflows.length },
		});
	} catch (error) {
		console.error("Failed to list workflows:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to fetch workflows"), status: 500 };
	}
};
