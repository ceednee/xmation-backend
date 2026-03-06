import type { Workflow, ActionConfig } from "../types";
import type { ActionContext, ActionResult } from "../actions/types";
import { getActionDefinition, validateActionConfig } from "../actions/executors";

export interface WorkflowExecutionResult {
  workflowId: string;
  runId: string;
  success: boolean;
  actions: ActionResult[];
  startedAt: number;
  completedAt: number;
  error?: string;
}

/**
 * Execute a single action
 */
export async function executeAction(
  action: ActionConfig,
  context: ActionContext
): Promise<ActionResult> {
  const start = Date.now();
  const definition = getActionDefinition(action.type);

  if (!definition) {
    return {
      success: false,
      actionType: action.type,
      error: `Unknown action type: ${action.type}`,
      executionTimeMs: Date.now() - start,
    };
  }

  // Validate required config
  const validationErrors = validateActionConfig(action.type, action.config);
  if (validationErrors.length > 0) {
    return {
      success: false,
      actionType: action.type,
      error: validationErrors.join(", "),
      executionTimeMs: Date.now() - start,
    };
  }

  // Merge default config
  const config = {
    ...definition.defaultConfig,
    ...action.config,
  };

  try {
    const result = await definition.executor(config, context);
    return result;
  } catch (error) {
    return {
      success: false,
      actionType: action.type,
      error: error instanceof Error ? error.message : "Action execution failed",
      executionTimeMs: Date.now() - start,
    };
  }
}

/**
 * Execute all actions in a workflow
 */
export async function executeWorkflowActions(
  workflow: Workflow,
  triggerData: Record<string, any>,
  context: Omit<ActionContext, "triggerData" | "previousResults">
): Promise<WorkflowExecutionResult> {
  const startedAt = Date.now();
  const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const actionContext: ActionContext = {
    ...context,
    workflowId: workflow._id,
    runId,
    triggerData,
    previousResults: [],
    dryRun: workflow.isDryRun,
  };

  const results: ActionResult[] = [];

  for (const action of workflow.actions) {
    // Check condition if present
    if (action.condition) {
      const conditionMet = evaluateCondition(action.condition, triggerData);
      if (!conditionMet) {
        results.push({
          success: true,
          actionType: action.type,
          output: { skipped: true, reason: "Condition not met" },
          executionTimeMs: 0,
        });
        continue;
      }
    }

    // Execute action
    const result = await executeAction(action, actionContext);
    results.push(result);
    actionContext.previousResults = results;

    // Handle delay
    if (action.delay && action.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(action.delay!, 5000)));
    }

    // Stop on error if not continuing
    if (!result.success && action.config.continueOnError !== true) {
      return {
        workflowId: workflow._id,
        runId,
        success: false,
        actions: results,
        startedAt,
        completedAt: Date.now(),
        error: `Action ${action.type} failed: ${result.error}`,
      };
    }
  }

  const allSuccessful = results.every((r) => r.success);

  return {
    workflowId: workflow._id,
    runId,
    success: allSuccessful,
    actions: results,
    startedAt,
    completedAt: Date.now(),
  };
}

/**
 * Evaluate a condition
 */
function evaluateCondition(
  condition: any,
  data: Record<string, any>
): boolean {
  const { field, operator, value } = condition;
  const fieldValue = data[field];

  switch (operator) {
    case "eq":
      return fieldValue === value;
    case "ne":
      return fieldValue !== value;
    case "gt":
      return fieldValue > value;
    case "lt":
      return fieldValue < value;
    case "gte":
      return fieldValue >= value;
    case "lte":
      return fieldValue <= value;
    case "contains":
      return String(fieldValue).includes(value);
    default:
      return false;
  }
}

/**
 * Create action context
 */
export function createActionContext(
  userId: string,
  xUserId: string | undefined,
  dryRun: boolean
): Omit<ActionContext, "workflowId" | "runId" | "triggerData" | "previousResults"> {
  return {
    userId,
    xUserId,
    dryRun,
  };
}
