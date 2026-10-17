import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { StatusBanner } from "@/components/ui/status-banner";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">
            Rurango Studio
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-foreground-secondary">
            Secure access for internal business operations. Not part of the
            public portfolio site.
          </p>
        </div>
        <Suspense
          fallback={
            <StatusBanner tone="info">Loading sign-in form…</StatusBanner>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
