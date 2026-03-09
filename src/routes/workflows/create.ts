import { config } from "../../config/env";
import type { WorkflowBody } from "./types";
import type { Workflow } from "../../types";
import { getConvexClient, api } from "./convex";
import { generateId, PLACEHOLDER_USER_ID, mapTriggers, mapActions, createSuccessResponse, createErrorResponse } from "./utils";

const createMockWorkflow = (body: WorkflowBody): Workflow => ({
	_id: generateId(),
	userId: PLACEHOLDER_USER_ID,
	name: body.name,
	description: body.description || "",
	status: "draft",
	currentVersionId: "",
	isDryRun: body.isDryRun ?? false,
	triggers: mapTriggers(body.triggers),
	actions: mapActions(body.actions),
	createdAt: Date.now(),
	updatedAt: Date.now(),
});

export const createWorkflow = async (body: WorkflowBody) => {
	try {
		const effectiveUserId = PLACEHOLDER_USER_ID;

		if (config.IS_TEST) {
			return createSuccessResponse(createMockWorkflow(body));
		}

		const convex = getConvexClient();
		const result = await convex.mutation(api.workflows.create, {
			name: body.name,
			description: body.description || "",
			triggers: body.triggers.map((t, i) => ({
				id: `tr_${i}_${Date.now()}`,
				type: t.type,
				config: t.config || {},
				enabled: true,
			})),
			actions: body.actions.map((a, i) => ({
				id: `ac_${i}_${Date.now()}`,
				type: a.type,
				config: a.config || {},
				delay: a.delay || 0,
			})),
			isDryRun: body.isDryRun ?? false,
		});

		const workflow = await convex.query(api.workflows.get, { id: result.id });
		return createSuccessResponse(workflow);
	} catch (error) {
		console.error("Failed to create workflow:", error);
		return { ...createErrorResponse("DATABASE_ERROR", "Failed to create workflow"), status: 500 };
	}
};
