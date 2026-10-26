import Image from "next/image";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { isStudioEmailConfigured } from "@/lib/email/resend";

export const metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
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
            Forgot password
          </h1>
          <p className="text-sm text-foreground-secondary">
            Enter your account email and we will send a reset link if it matches
            a Studio user.
          </p>
        </div>
        <ForgotPasswordForm emailConfigured={isStudioEmailConfigured()} />
      </div>
    </div>
  );
}
