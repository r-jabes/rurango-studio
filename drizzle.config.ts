import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js uses .env.local; drizzle-kit does not load it by default.
config({ path: ".env.local" });
config(); // optional .env fallback

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required for drizzle-kit. Set it in studio/.env.local",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
