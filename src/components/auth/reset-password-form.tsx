"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { StatusBanner } from "@/components/ui/status-banner";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing a token. Request a new link.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (result.error) {
        const message =
          result.error.message ??
          "Could not reset password. Request a new link.";
        setError(message);
        toast.error(message, "Reset failed");
        return;
      }

      toast.success("Password updated. Sign in with your new password.", "Done");
      router.replace("/login");
      router.refresh();
    });
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <StatusBanner tone="warning">
          This reset link is invalid or incomplete. Request a new one from the
          forgot password page.
        </StatusBanner>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-accent underline-offset-2 hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}

      <div>
        <Label htmlFor="password">New password</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <PasswordInput
          id="confirm"
          name="confirm"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Updating…" : "Update password"}
      </Button>

      <p className="text-center text-sm text-foreground-secondary">
        <Link
          href="/login"
          className="text-accent underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
