import { Elysia, t } from "elysia";
import { protectedRoute } from "../middleware/convex-auth";
import {
  getAllTriggerDefinitions,
  getTriggerDefinition,
} from "../triggers/evaluators";
import {
  evaluateTrigger,
  evaluateWorkflowTriggers,
  buildTriggerContext,
} from "../services/trigger-engine";
import type { Workflow } from "../types";

// In-memory store for MVP
const workflowsStore = new Map<string, Workflow>();

export const triggerRoutes = new Elysia({ prefix: "/triggers" })
  // Apply auth middleware
  .onBeforeHandle(async (context) => {
    const result = await protectedRoute()(context);
    if (result) return result;
  })

  // GET /triggers - List all available triggers
  .get("/", () => {
    const definitions = getAllTriggerDefinitions();

    return {
      success: true,
      data: definitions.map((def) => ({
        type: def.type,
        name: def.name,
        description: def.description,
        defaultConfig: def.defaultConfig,
      })),
    };
  })

  // GET /triggers/:type - Get specific trigger info
  .get("/:type", ({ params, set }: any) => {
    const definition = getTriggerDefinition(params.type);

    if (!definition) {
      set.status = 404;
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Trigger type '${params.type}' not found`,
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
      },
    };
  })

  // POST /triggers/test - Test a trigger
  .post(
    "/test",
    async ({ body, request }: any) => {
      const userId = request.headers.get("x-user-id") || "user_123";

      const result = await evaluateTrigger(
        {
          id: "test_trigger",
          type: body.triggerType,
          config: body.config || {},
          enabled: true,
        },
        buildTriggerContext(userId, body.xUserId || "x_123", {
          mentions: body.testData?.mentions || [],
          replies: body.testData?.replies || [],
          retweets: body.testData?.retweets || [],
          posts: body.testData?.posts || [],
          followers: body.testData?.followers || [],
          dms: body.testData?.dms || [],
          lastPostTime: body.testData?.lastPostTime,
          links: body.testData?.links || [],
          manualTrigger: body.testData?.manualTrigger,
        })
      );

      return {
        success: true,
        data: {
          triggerType: body.triggerType,
          triggered: result.triggered,
          result,
          timestamp: Date.now(),
        },
      };
    },
    {
      body: t.Object({
        triggerType: t.String(),
        config: t.Optional(t.Record(t.String(), t.Any())),
        xUserId: t.Optional(t.String()),
        testData: t.Optional(
          t.Record(t.String(), t.Any())
        ),
      }),
    }
  )

  // POST /triggers/evaluate-workflow/:id - Evaluate workflow triggers
  .post(
    "/evaluate-workflow/:id",
    async ({ params, body, request, set }: any) => {
      const workflow = workflowsStore.get(params.id);

      if (!workflow) {
        set.status = 404;
        return {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Workflow not found",
          },
        };
      }

      const userId = request.headers.get("x-user-id") || "user_123";

      const result = await evaluateWorkflowTriggers(
        workflow,
        buildTriggerContext(userId, body.xUserId || "x_123", {
          mentions: body.context?.mentions || [],
          replies: body.context?.replies || [],
          retweets: body.context?.retweets || [],
          posts: body.context?.posts || [],
          followers: body.context?.followers || [],
          dms: body.context?.dms || [],
          lastPostTime: body.context?.lastPostTime,
          links: body.context?.links || [],
          manualTrigger: body.context?.manualTrigger,
        })
      );

      return {
        success: true,
        data: {
          workflowId: params.id,
          triggered: result.triggered,
          triggers: result.triggers,
          timestamp: result.timestamp,
        },
      };
    },
    {
      body: t.Object({
        xUserId: t.Optional(t.String()),
        context: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  );

export default triggerRoutes;
