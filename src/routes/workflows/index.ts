import { Elysia } from "elysia";
import { createWorkflowSchema, updateWorkflowSchema, testWorkflowSchema, listWorkflowsQuerySchema } from "./schemas";
import { listWorkflows } from "./list";
import { createWorkflow } from "./create";
import { getWorkflow } from "./get";
import { updateWorkflow } from "./update";
import { removeWorkflow } from "./remove";
import { activateWorkflow } from "./activate";
import { pauseWorkflow } from "./pause";
import { testWorkflow } from "./test";

export const workflowRoutes = new Elysia({ prefix: "/workflows" })
	.get("/", async ({ query }) => {
		const result = await listWorkflows(query?.status);
		if (result.status) return result;
		return result;
	}, { query: listWorkflowsQuerySchema })

	.post("/", async ({ body }) => {
		const result = await createWorkflow(body);
		if (result.status) return result;
		return result;
	}, { body: createWorkflowSchema })

	.get("/:id", async ({ params }) => {
		const result = await getWorkflow(params.id);
		if (result.status) return result;
		return result;
	})

	.patch("/:id", async ({ params, body }) => {
		const result = await updateWorkflow(params.id, body);
		if (result.status) return result;
		return result;
	}, { body: updateWorkflowSchema })

	.delete("/:id", async ({ params }) => {
		const result = await removeWorkflow(params.id);
		if (result.status) return result;
		return result;
	})

	.post("/:id/activate", async ({ params }) => {
		const result = await activateWorkflow(params.id);
		if (result.status) return result;
		return result;
	})

	.post("/:id/pause", async ({ params }) => {
		const result = await pauseWorkflow(params.id);
		if (result.status) return result;
		return result;
	})

	.post("/:id/test", async ({ params, body }) => {
		const result = await testWorkflow(params.id, body);
		if (result.status) return result;
		return result;
	}, { body: testWorkflowSchema });

export default workflowRoutes;
