import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendStudioEmail } from "@/lib/email/resend";
import { getStudioUrl } from "@/lib/site-url";

export const auth = betterAuth({
  appName: "Rurango Studio",
  baseURL: process.env.BETTER_AUTH_URL ?? getStudioUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      twoFactor: schema.twoFactor,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Owner accounts are created via the development seed script only.
    disableSignUp: true,
    async sendResetPassword({ user, url }) {
      const result = await sendStudioEmail({
        to: user.email,
        subject: "Reset your Rurango Studio password",
        text: [
          `Hello${user.name ? ` ${user.name}` : ""},`,
          "",
          "We received a request to reset your Rurango Studio password.",
          "Open the link below to choose a new password. This link expires soon.",
          "",
          url,
          "",
          "If you did not request this, you can ignore this email.",
          "",
          "— Rurango Studio",
        ].join("\n"),
        html: `
          <p>Hello${user.name ? ` ${escapeHtml(user.name)}` : ""},</p>
          <p>We received a request to reset your Rurango Studio password.</p>
          <p><a href="${escapeHtml(url)}">Reset your password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
          <p>— Rurango Studio</p>
        `.trim(),
      });
      if (!result.ok) {
        throw new Error(result.error);
      }
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "owner",
        input: false,
      },
      disabledAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    twoFactor({
      issuer: "Rurango Studio",
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
