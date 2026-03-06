import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CONVEX_URL: z.string().url().default("http://localhost:3210"),
  X_CLIENT_ID: z.string().default("test_client_id"),
  X_CLIENT_SECRET: z.string().default("test_client_secret"),
  ENCRYPTION_KEY: z.string().min(32).default("test-32-character-encryption-key-here"),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  RAPIDAPI_KEY: z.string().default("test_rapidapi_key"),
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  parsed.error.issues.forEach((issue) => {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  });
  process.exit(1);
}

export const config = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  IS_DEV: parsed.data.NODE_ENV === "development",
  IS_PROD: parsed.data.NODE_ENV === "production",
  IS_TEST: parsed.data.NODE_ENV === "test",
};
