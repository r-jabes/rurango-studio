import { config } from "dotenv";
import { hashPassword } from "better-auth/crypto";

config({ path: ".env.local" });
config();

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { account, companySettings, documentTemplates, user } from "@/db/schema";
import { isDevelopmentApp } from "@/lib/env";
import { logger } from "@/lib/logger";

function createId() {
  return crypto.randomUUID();
}

async function seed() {
  if (!isDevelopmentApp()) {
    throw new Error("db:seed is restricted to development APP_ENV.");
  }

  const email = process.env.SEED_OWNER_EMAIL;
  const name = process.env.SEED_OWNER_NAME ?? "Studio Owner";
  const password = process.env.SEED_OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in .env.local before seeding.",
    );
  }

  if (password.length < 12) {
    throw new Error("SEED_OWNER_PASSWORD must be at least 12 characters.");
  }

  const existing = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (existing) {
    logger.info("Owner already exists; skipping user create", { email });
  } else {
    const userId = createId();
    const now = new Date();
    const passwordHash = await hashPassword(password);

    await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: true,
      role: "owner",
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(account).values({
      id: createId(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    logger.info("Created development owner account", { email });
  }

  const settings = await db.query.companySettings.findFirst();
  if (!settings) {
    await db.insert(companySettings).values({
      legalName: "RURANGO",
      tradingName: "RURANGO",
      defaultCurrency: process.env.DEFAULT_CURRENCY ?? "RWF",
    });
    logger.info("Inserted default company settings");
  } else {
    logger.info("Company settings already present; skipping");
  }

  const templateCount = await db.query.documentTemplates.findMany({
    columns: { id: true },
    limit: 1,
  });
  if (templateCount.length === 0) {
    await db.insert(documentTemplates).values([
      {
        type: "proposal",
        name: "Standard proposal",
        defaultPaymentTerms: "50% to start, balance on delivery",
        defaultNotes: "Valid for 14 days unless otherwise stated.",
        bodyHtml:
          "Scope, timeline, and responsibilities will be confirmed before kickoff.",
      },
      {
        type: "quotation",
        name: "Standard quotation",
        defaultPaymentTerms: "Net 14",
        defaultNotes: "Prices exclude third-party fees unless listed.",
      },
      {
        type: "agreement",
        name: "Standard agreement",
        defaultPaymentTerms: "As specified in the payment schedule",
        defaultNotes:
          "Upload a wet-ink or countersigned PDF under signed copy after issue.",
      },
      {
        type: "invoice",
        name: "Standard invoice",
        defaultPaymentTerms: "Due on receipt",
        defaultNotes: "Thank you for your business.",
      },
    ]);
    logger.info("Inserted default commercial templates");
  } else {
    logger.info("Templates already present; skipping");
  }
}

seed()
  .then(() => {
    logger.info("Seed completed");
    process.exit(0);
  })
  .catch((error: unknown) => {
    logger.error("Seed failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    process.exit(1);
  });
