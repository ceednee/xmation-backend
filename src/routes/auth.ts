/**
 * Auth Routes - Placeholder
 */

import { Elysia } from "elysia";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .get("/me", async () => ({
    authenticated: false,
    message: "Auth not implemented",
  }));
