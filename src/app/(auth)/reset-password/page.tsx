import Image from "next/image";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { StatusBanner } from "@/components/ui/status-banner";

export const metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <div className="flex h-dvh items-center justify-center overflow-y-auto px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/light_logo.png"
              alt="RURANGO"
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
              Studio
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Reset password
          </h1>
          <p className="text-sm text-foreground-secondary">
            Choose a new password for your Studio account.
          </p>
        </div>
        <Suspense
          fallback={
            <StatusBanner tone="info">Loading reset form…</StatusBanner>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
