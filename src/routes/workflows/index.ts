/**
 * Workflows API Routes Module
 * 
 * REST API endpoints for workflow CRUD operations and lifecycle management.
 * 
 * ## Endpoints
 * 
 * | Method | Path | Description |
 * |--------|------|-------------|
 * | POST | /workflows | Create new workflow |
 * | GET | /workflows | List user's workflows |
 * | GET | /workflows/:id | Get single workflow |
 * | PATCH | /workflows/:id | Update workflow |
 * | DELETE | /workflows/:id | Delete workflow |
 * | POST | /workflows/:id/activate | Activate draft workflow |
 * | POST | /workflows/:id/pause | Pause active workflow |
 * | POST | /workflows/:id/test | Test run (dry-run) |
 * 
 * ## Workflow Lifecycle
 * 
 * ```
 * Create (draft) → Activate (active) → [Pause/Resume]
 *                       ↓
 *                   Triggers fire
 *                       ↓
 *                   Actions execute
 * ```
 * 
 * ## Module Structure
 * 
 * - `create.ts` - POST /workflows endpoint
 * - `list.ts` - GET /workflows endpoint
 * - `get.ts` - GET /workflows/:id endpoint
 * - `update.ts` - PATCH /workflows/:id endpoint
 * - `remove.ts` - DELETE /workflows/:id endpoint
 * - `activate.ts` - POST /workflows/:id/activate endpoint
 * - `pause.ts` - POST /workflows/:id/pause endpoint
 * - `test.ts` - POST /workflows/:id/test endpoint
 * - `schemas.ts` - Validation schemas
 * - `types.ts` - TypeScript interfaces
 * 
 * ## Usage
 * 
 * ```typescript
 * import { workflowRoutes } from "./routes/workflows";
 * 
 * const app = new Elysia()
 *   .use(workflowRoutes);
 * ```
 */

import { Elysia, t } from "elysia";
import { createWorkflow } from "./create";
import { listWorkflows } from "./list";
import { getWorkflow } from "./get";
import { updateWorkflow } from "./update";
import { removeWorkflow } from "./remove";
import { activateWorkflow } from "./activate";
import { pauseWorkflow } from "./pause";
import { testWorkflow } from "./test";

// Re-export individual handlers for advanced use
export { createWorkflow } from "./create";
export { listWorkflows } from "./list";
export { getWorkflow } from "./get";
export { updateWorkflow } from "./update";
export { removeWorkflow } from "./remove";
export { activateWorkflow } from "./activate";
export { pauseWorkflow } from "./pause";
export { testWorkflow } from "./test";
export type { 
  CreateWorkflowRequest, 
  UpdateWorkflowRequest,
  WorkflowResponse,
  WorkflowListResponse 
} from "./types";

/**
 * Workflow routes Elysia plugin.
 * Mounts all workflow endpoints at /workflows
 */
export const workflowRoutes = new Elysia({ prefix: "/workflows" })
	// POST /workflows - Create new workflow
	.post("/", async ({ body }) => {
		return await createWorkflow(body as any);
	})
	
	// GET /workflows - List workflows
	.get("/", async ({ query }) => {
		return await listWorkflows(query?.status);
	})
	
	// GET /workflows/:id - Get single workflow
	.get("/:id", async ({ params, set }) => {
		const result = await getWorkflow(params.id) as { status?: number; success: boolean; data?: unknown; error?: { code: string; message: string } };
		if (result.status === 404) {
			set.status = 404;
		}
		return result;
	})
	
	// PATCH /workflows/:id - Update workflow
	.patch("/:id", async ({ params, body }) => {
		return await updateWorkflow(params.id, body as any);
	})
	
	// DELETE /workflows/:id - Delete workflow
	.delete("/:id", async ({ params }) => {
		return await removeWorkflow(params.id);
	})
	
	// POST /workflows/:id/activate - Activate workflow
	.post("/:id/activate", async ({ params }) => {
		return await activateWorkflow(params.id);
	})
	
	// POST /workflows/:id/pause - Pause workflow
	.post("/:id/pause", async ({ params }) => {
		return await pauseWorkflow(params.id);
	})
	
	// POST /workflows/:id/test - Test workflow
	.post("/:id/test", async ({ params, body }) => {
		return await testWorkflow(params.id, body as any);
	});

export default workflowRoutes;
