import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { logger } from "@/lib/logger";

export type AppRole = "owner" | "member" | "client";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const disabledAt = (
    session.user as typeof session.user & { disabledAt?: Date | string | null }
  ).disabledAt;
  if (disabledAt) {
    logger.warn("Disabled user attempted access", {
      userId: session.user.id,
    });
    redirect("/login?error=disabled");
  }
  return session;
}

export async function requireRole(allowed: AppRole[]) {
  const session = await requireSession();
  const role =
    ((session.user as typeof session.user & { role?: AppRole }).role as
      | AppRole
      | undefined) ?? "owner";
  if (!allowed.includes(role)) {
    redirect("/?error=forbidden");
  }
  return session;
}
