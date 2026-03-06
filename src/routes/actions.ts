import { Elysia, t } from "elysia";
import { protectedRoute } from "../middleware/convex-auth";
import {
  getAllActionDefinitions,
  getActionDefinition,
  validateActionConfig,
} from "../actions/executors";
import { executeAction, createActionContext } from "../services/action-engine";

export const actionRoutes = new Elysia({ prefix: "/actions" })
  // Apply auth middleware
  .onBeforeHandle(async (context) => {
    const result = await protectedRoute()(context);
    if (result) return result;
  })

  // GET /actions - List all available actions
  .get("/", () => {
    const definitions = getAllActionDefinitions();

    return {
      success: true,
      data: definitions.map((def) => ({
        type: def.type,
        name: def.name,
        description: def.description,
        defaultConfig: def.defaultConfig,
        requiredConfig: def.requiredConfig,
      })),
    };
  })

  // GET /actions/:type - Get specific action info
  .get("/:type", ({ params, set }: any) => {
    const definition = getActionDefinition(params.type);

    if (!definition) {
      set.status = 404;
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Action type '${params.type}' not found`,
        },
      };
    }

    return {
      success: true,
      data: {
        type: definition.type,
        name: definition.name,
        description: definition.description,
        defaultConfig: definition.defaultConfig,
        requiredConfig: definition.requiredConfig,
      },
    };
  })

  // POST /actions/validate - Validate action configuration
  .post(
    "/validate",
    ({ body }: any) => {
      const errors = validateActionConfig(body.actionType, body.config);

      if (errors.length > 0) {
        return {
          success: false,
          valid: false,
          errors,
        };
      }

      return {
        success: true,
        valid: true,
      };
    },
    {
      body: t.Object({
        actionType: t.String(),
        config: t.Record(t.String(), t.Any()),
      }),
    }
  )

  // POST /actions/test - Test an action
  .post(
    "/test",
    async ({ body, request }: any) => {
      const userId = request.headers.get("x-user-id") || "user_123";

      const result = await executeAction(
        {
          id: "test_action",
          type: body.actionType,
          config: body.config,
        },
        {
          userId,
          xUserId: body.xUserId || "x_123",
          workflowId: "test_workflow",
          runId: `test_${Date.now()}`,
          triggerData: body.triggerData || {},
          dryRun: body.dryRun ?? true,
        }
      );

      return {
        success: true,
        data: {
          actionType: body.actionType,
          result,
          dryRun: body.dryRun ?? true,
          timestamp: Date.now(),
        },
      };
    },
    {
      body: t.Object({
        actionType: t.String(),
        config: t.Record(t.String(), t.Any()),
        xUserId: t.Optional(t.String()),
        triggerData: t.Optional(t.Record(t.String(), t.Any())),
        dryRun: t.Optional(t.Boolean()),
      }),
    }
  );

export default actionRoutes;
