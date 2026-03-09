import { config } from "../../config/env";
import type { TestWorkflowBody } from "./types";
import { getConvexClient, api } from "./convex";
import { createSuccessResponse, createErrorResponse } from "./utils";

const createMockTestResult = (id: string, triggerData: Record<string, unknown>) => ({
	mode: "dry_run",
	workflowId: id,
	wouldExecute: true,
	triggers: ["MOUSE_ENTER"],
	actions: [
		{
			action: "SEND_EMAIL",
			wouldExecute: true,
			input: { to: "test@example.com" },
		},
	],
	logs: ["Trigger: MOUSE_ENTER detected", "Action: SEND_EMAIL would be executed"],
	triggerData,
});

export const testWorkflow = async (id: string, body: TestWorkflowBody | null) => {
	try {
		const triggerData = body?.triggerData || {};

		if (config.IS_TEST) {
			return createSuccessResponse(createMockTestResult(id, triggerData));
		}

		const convex = getConvexClient();
		const result = await convex.mutation(api.workflows.test, {
			id: id as any,
			triggerData,
		});

		return createSuccessResponse({ workflowId: id, ...result });
	} catch (error) {
		if (error instanceof Error && error.message.includes("not found")) {
			return { ...createErrorResponse("NOT_FOUND", "Workflow not found"), status: 404 };
		}

		console.error("Failed to test workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to test workflow"), status: 500 };
	}
};
