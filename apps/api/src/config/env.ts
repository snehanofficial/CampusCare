import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.preprocess((val) => (val ? Number(val) : 3000), z.number().int().positive()),
  HOST: z.string().default("localhost"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL connection URL"),
  JWT_ACCESS_SECRET: z.string().min(8, "JWT_ACCESS_SECRET must be at least 8 characters long"),
  JWT_REFRESH_SECRET: z.string().min(8, "JWT_REFRESH_SECRET must be at least 8 characters long"),
  SOCKET_PORT: z.preprocess((val) => (val ? Number(val) : 3001), z.number().int().positive()),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.preprocess((val) => (val ? Number(val) : 587), z.number().int().positive()),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is required"),
  SMTP_FROM: z.string().default("noreply@campuscare.edu"),
  VAPID_PUBLIC_KEY: z.string().min(1, "VAPID_PUBLIC_KEY is required"),
  VAPID_PRIVATE_KEY: z.string().min(1, "VAPID_PRIVATE_KEY is required")
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment configurations:");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
