// @ts-nocheck
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import {
	executeAction,
	executeWorkflowActions,
	createActionContext,
} from "../../../services/action-engine";

describe("Action Engine Service", () => {
	let originalConsoleError: typeof console.error;
	let originalConsoleLog: typeof console.log;

	beforeAll(() => {
		// Suppress expected console errors/logs from Convex connection failures
		originalConsoleError = console.error;
		originalConsoleLog = console.log;
		console.error = () => {};
		console.log = () => {};
	});

	afterAll(() => {
		console.error = originalConsoleError;
		console.log = originalConsoleLog;
	});

	describe("executeAction", () => {
		it("should return error for unknown action", async () => {
			const result = await executeAction(
				{ type: "UNKNOWN", config: {} },
				{ userId: "u1", workflowId: "w1", runId: "r1", triggerData: {}, dryRun: false },
			);

			expect(result.success).toBe(false);
			expect(result.error).toContain("Unknown");
		});

		it("should return validation error for invalid config", async () => {
			// REPLY_TO_TWEET requires 'text' in config
			const result = await executeAction(
				{ type: "REPLY_TO_TWEET", config: {} },
				{ userId: "u1", workflowId: "w1", runId: "r1", triggerData: {}, dryRun: false },
			);

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});
	});

	describe("executeWorkflowActions", () => {
		it("should execute workflow with actions", async () => {
			const workflow = {
				_id: "wf1",
				userId: "u1",
				actions: [
					{ type: "REPLY_TO_TWEET", config: { text: "Thanks!" } },
				],
				isDryRun: false,
			};

			const result = await executeWorkflowActions(
				workflow,
				{ tweetId: "t1" },
				{ userId: "u1", xUserId: "x1" },
			);

			expect(result.workflowId).toBe("wf1");
			expect(Array.isArray(result.actions)).toBe(true);
			expect(result.startedAt).toBeDefined();
			expect(result.completedAt).toBeDefined();
		});

		it("should handle empty workflow", async () => {
			const workflow = {
				_id: "wf1",
				userId: "u1",
				actions: [],
				isDryRun: false,
			};

			const result = await executeWorkflowActions(
				workflow,
				{},
				{ userId: "u1", xUserId: "x1" },
			);

			expect(result.success).toBe(true);
			expect(result.actions).toHaveLength(0);
		});
	});

	describe("createActionContext", () => {
		it("should create action context with required fields", () => {
			const context = createActionContext("u1", "x1", false);

			expect(context.userId).toBe("u1");
			expect(context.xUserId).toBe("x1");
			expect(context.dryRun).toBe(false);
		});
	});
});
