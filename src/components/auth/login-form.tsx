"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { StatusBanner } from "@/components/ui/status-banner";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [needsTwoFactor, setNeedsTwoFactor] = useState(
    searchParams.get("twoFactor") === "1",
  );

  const disabledError = searchParams.get("error") === "disabled";

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const code = String(form.get("code") ?? "").trim();

    startTransition(async () => {
      if (needsTwoFactor) {
        const result = await authClient.twoFactor.verifyTotp({
          code,
        });
        if (result.error) {
          const message =
            result.error.message ?? "Invalid authentication code.";
          setError(message);
          toast.error(message, "Verification failed");
          return;
        }
        toast.success("Signed in.", "Welcome");
        const next = searchParams.get("next");
        router.replace(next && next.startsWith("/") ? next : "/");
        router.refresh();
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        const message = result.error.message ?? "Sign in failed.";
        setError(message);
        toast.error(message, "Sign in failed");
        return;
      }

      // twoFactorClient may already redirect; if not, continue.
      if (
        result.data &&
        typeof result.data === "object" &&
        "twoFactorRedirect" in result.data &&
        (result.data as { twoFactorRedirect?: boolean }).twoFactorRedirect
      ) {
        setNeedsTwoFactor(true);
        toast.info("Enter your authenticator code to continue.", "MFA required");
        return;
      }

      toast.success("Signed in.", "Welcome");
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {disabledError ? (
        <StatusBanner tone="warning">
          This account is disabled. Contact the Studio owner.
        </StatusBanner>
      ) : null}
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {needsTwoFactor ? (
        <StatusBanner tone="info">
          Enter the code from your authenticator app to finish signing in.
        </StatusBanner>
      ) : null}

      {!needsTwoFactor ? (
        <>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <Label htmlFor="password" className="mb-0">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-accent underline-offset-2 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </div>
        </>
      ) : (
        <div>
          <Label htmlFor="code">Authentication code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full" loading={pending}>
        {pending
          ? "Please wait…"
          : needsTwoFactor
            ? "Verify code"
            : "Sign in"}
      </Button>
    </form>
  );
}
