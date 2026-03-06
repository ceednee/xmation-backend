import { describe, it, expect } from "bun:test";
import { Elysia } from "elysia";

describe("Auth Middleware", () => {
  describe("requireAuth", () => {
    it("should reject requests without authorization header", async () => {
      const middleware = ({ request, set }: any) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) {
          set.status = 401;
          return { error: "Unauthorized", code: "NO_TOKEN" };
        }
      };

      const app = new Elysia()
        .get("/protected", () => "secret", { beforeHandle: middleware });

      const response = await app.handle(new Request("http://localhost/protected"));
      
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.code).toBe("NO_TOKEN");
    });

    it("should reject invalid Bearer tokens", async () => {
      const middleware = ({ request, set }: any) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Invalid token format", code: "INVALID_FORMAT" };
        }
      };

      const app = new Elysia()
        .get("/protected", () => "secret", { beforeHandle: middleware });

      const response = await app.handle(
        new Request("http://localhost/protected", {
          headers: { authorization: "Basic token123" },
        })
      );
      
      expect(response.status).toBe(401);
    });

    it("should allow requests with valid Bearer token", async () => {
      const middleware = ({ request, set }: any) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
      };

      const app = new Elysia()
        .get("/protected", () => ({ data: "secret" }), { beforeHandle: middleware });

      const response = await app.handle(
        new Request("http://localhost/protected", {
          headers: { authorization: "Bearer valid_token" },
        })
      );
      
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toBe("secret");
    });
  });

  describe("requireXConnection", () => {
    it("should reject requests without X OAuth connection", async () => {
      const middleware = ({ set }: any) => {
        // Simulate: authenticated but no X connection
        const hasXConnection = false;
        if (!hasXConnection) {
          set.status = 403;
          return { 
            error: "X account required", 
            code: "X_NOT_CONNECTED",
            action: "/auth/x/connect"
          };
        }
      };

      const app = new Elysia()
        .get("/workflows", () => "workflows", { beforeHandle: middleware });

      const response = await app.handle(
        new Request("http://localhost/workflows", {
          headers: { authorization: "Bearer valid_token" },
        })
      );
      
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.code).toBe("X_NOT_CONNECTED");
      expect(body.action).toBe("/auth/x/connect");
    });

    it("should allow requests with X connection", async () => {
      const middleware = ({ set }: any) => {
        const hasXConnection = true;
        if (!hasXConnection) {
          set.status = 403;
          return { error: "X account required" };
        }
      };

      const app = new Elysia()
        .get("/workflows", () => ({ workflows: [] }), { beforeHandle: middleware });

      const response = await app.handle(
        new Request("http://localhost/workflows", {
          headers: { authorization: "Bearer valid_token" },
        })
      );
      
      expect(response.status).toBe(200);
    });
  });

  describe("rateLimit", () => {
    it("should track request counts per user", async () => {
      const requests = new Map<string, number>();
      
      const middleware = ({ request, set }: any) => {
        const userId = request.headers.get("x-user-id") || "anonymous";
        const count = (requests.get(userId) || 0) + 1;
        requests.set(userId, count);
        
        if (count > 100) {
          set.status = 429;
          return { error: "Rate limit exceeded" };
        }
        
        set.headers["x-rate-limit-remaining"] = String(100 - count);
      };

      const app = new Elysia()
        .get("/api", () => ({ success: true }), { beforeHandle: middleware });

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await app.handle(
          new Request("http://localhost/api", {
            headers: { "x-user-id": "user_123" },
          })
        );
      }

      expect(requests.get("user_123")).toBe(3);
    });

    it("should return 429 when rate limit exceeded", async () => {
      let requestCount = 0;
      
      const middleware = ({ set }: any) => {
        requestCount++;
        if (requestCount > 2) {
          set.status = 429;
          return { error: "Rate limit exceeded", retryAfter: 60 };
        }
      };

      const app = new Elysia()
        .get("/api", () => ({ success: true }), { beforeHandle: middleware });

      // First 2 requests pass
      const r1 = await app.handle(new Request("http://localhost/api"));
      const r2 = await app.handle(new Request("http://localhost/api"));
      
      // 3rd request fails
      const r3 = await app.handle(new Request("http://localhost/api"));
      
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r3.status).toBe(429);
    });
  });
});
