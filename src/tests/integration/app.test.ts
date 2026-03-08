import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";
import { app } from "../../index";

describe("App Setup", () => {
	it("should create Elysia app instance", () => {
		const testApp = new Elysia();
		expect(testApp).toBeDefined();
	});

	it("should have health check endpoint returning 200", async () => {
		const response = await app.handle(new Request("http://localhost/health"));

		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body.status).toBe("ok");
		expect(body.timestamp).toBeDefined();
	});

	it("should return 404 for unknown routes", async () => {
		const response = await app.handle(new Request("http://localhost/unknown"));

		expect(response.status).toBe(404);
	});

	it("should include API version in health response", async () => {
		const response = await app.handle(new Request("http://localhost/health"));
		const body = await response.json();

		expect(body.version).toBe("1.0.0");
		expect(body.service).toBe("xmation-backend");
	});

	it("should have root endpoint with API info", async () => {
		const response = await app.handle(new Request("http://localhost/"));

		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body.message).toBe("X Automation API");
		expect(body.version).toBe("1.0.0");
		expect(body.docs).toBe("/swagger");
	});

	it("should have swagger docs endpoint", async () => {
		const response = await app.handle(new Request("http://localhost/swagger"));

		expect(response.status).toBe(200);
	});
});
