import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  NEXT_PUBLIC_STUDIO_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().optional(),
  DEFAULT_CURRENCY: z.string().length(3).default("RWF"),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(26_214_400),
  UPLOAD_ALLOWED_MIME: z.string().default(
    "application/pdf,image/png,image/jpeg,image/webp,text/plain",
  ),
  SEED_OWNER_EMAIL: z.string().email().optional(),
  SEED_OWNER_NAME: z.string().optional(),
  SEED_OWNER_PASSWORD: z.string().optional(),
});

export type StudioEnv = z.infer<typeof envSchema>;

let cached: StudioEnv | null = null;

export function getEnv(): StudioEnv {
  if (cached) return cached;

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    APP_ENV: process.env.APP_ENV ?? process.env.NODE_ENV,
    NEXT_PUBLIC_STUDIO_URL: process.env.NEXT_PUBLIC_STUDIO_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY,
    UPLOAD_MAX_BYTES: process.env.UPLOAD_MAX_BYTES,
    UPLOAD_ALLOWED_MIME: process.env.UPLOAD_ALLOWED_MIME,
    SEED_OWNER_EMAIL: process.env.SEED_OWNER_EMAIL,
    SEED_OWNER_NAME: process.env.SEED_OWNER_NAME,
    SEED_OWNER_PASSWORD: process.env.SEED_OWNER_PASSWORD,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid Studio environment: ${details}`);
  }

  cached = parsed.data;
  return cached;
}

export { getStudioUrl } from "@/lib/site-url";

export function isDevelopmentApp() {
  const appEnv = process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
  return appEnv === "development";
}
