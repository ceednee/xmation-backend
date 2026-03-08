import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
	PORT: z.string().default("3000"),
	NODE_ENV: z
		.enum(["development", "production", "test"])
		.default("development"),
	CONVEX_URL: z.string().url().default("http://localhost:3210"),
	X_CLIENT_ID: z.string().min(1, "X_CLIENT_ID is required"),
	X_CLIENT_SECRET: z.string().min(1, "X_CLIENT_SECRET is required"),
	ENCRYPTION_KEY: z.string().min(32).refine(
		(val) => {
			// Reject weak/default keys in production
			const lowerVal = val.toLowerCase();
			return !lowerVal.includes('test') && 
			       !lowerVal.includes('default') && 
			       !lowerVal.includes('example') &&
			       !lowerVal.includes('changeme');
		},
		{ message: "ENCRYPTION_KEY must be a strong production key (not test/default/example/changeme)" }
	),
	REDIS_URL: z.string().url().default("redis://localhost:6379"),
	RAPIDAPI_KEY: z.string().min(1, "RAPIDAPI_KEY is required"),
	UPSTASH_REDIS_REST_URL: z.string().url().optional(),
	UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
	
	// Security settings
	ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
	MAX_BODY_SIZE: z.string().default("1048576"), // 1MB default
	REQUEST_TIMEOUT: z.string().default("30000"), // 30s default
});

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error("❌ Invalid environment variables:");
	for (const issue of parsed.error.issues) {
		console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
	}
	process.exit(1);
}

export const config = {
	...parsed.data,
	PORT: Number.parseInt(parsed.data.PORT, 10),
	IS_DEV: parsed.data.NODE_ENV === "development",
	IS_PROD: parsed.data.NODE_ENV === "production",
	IS_TEST: parsed.data.NODE_ENV === "test",
	USE_UPSTASH:
		!!parsed.data.UPSTASH_REDIS_REST_URL &&
		!!parsed.data.UPSTASH_REDIS_REST_TOKEN,
	ALLOWED_ORIGINS: parsed.data.ALLOWED_ORIGINS.split(",").map(s => s.trim()),
	MAX_BODY_SIZE: Number.parseInt(parsed.data.MAX_BODY_SIZE, 10),
	REQUEST_TIMEOUT: Number.parseInt(parsed.data.REQUEST_TIMEOUT, 10),
};
