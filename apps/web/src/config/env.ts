import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url("VITE_API_URL must be a valid URL"),
  VITE_SOCKET_URL: z.string().url("VITE_SOCKET_URL must be a valid URL").optional(),
  VITE_PORT: z.preprocess((val) => (val ? Number(val) : 5173), z.number().int().positive())
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error("❌ Invalid frontend environment configuration:");
  console.error(JSON.stringify(_env.error.format(), null, 2));
  throw new Error("Invalid environment configuration");
}

export const env = _env.data;
