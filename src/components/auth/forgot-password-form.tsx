"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm({ emailConfigured }: { emailConfigured: boolean }) {
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!emailConfigured) {
      setError(
        "Password recovery email is not configured. Add RESEND_API_KEY to Studio environment variables.",
      );
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        const message =
          result.error.message ??
          "Could not start password recovery. Try again shortly.";
        setError(message);
        toast.error(message, "Recovery failed");
        return;
      }

      setSent(true);
      toast.success(
        "If that email is registered, a reset link is on its way.",
        "Check your inbox",
      );
    });
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <StatusBanner tone="success">
          If an account exists for that address, we sent a reset link. Check
          your inbox and spam folder.
        </StatusBanner>
        <Link
          href="/login"
          className="inline-block text-sm text-accent underline-offset-2 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!emailConfigured ? (
        <StatusBanner tone="warning">
          Password recovery email is not configured yet. Add{" "}
          <code className="font-mono text-xs">RESEND_API_KEY</code> (and
          optionally{" "}
          <code className="font-mono text-xs">STUDIO_FROM_EMAIL</code>, default{" "}
          <code className="font-mono text-xs">contact@rurango.com</code>).
        </StatusBanner>
      ) : null}
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}

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

      <Button type="submit" className="w-full" loading={pending}>
        {pending ? "Sending…" : "Send reset link"}
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
