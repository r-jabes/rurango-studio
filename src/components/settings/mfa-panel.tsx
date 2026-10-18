"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";

type MfaPanelProps = {
  enabled: boolean;
};

export function MfaPanel({ enabled }: MfaPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  function enable() {
    startTransition(async () => {
      const result = await authClient.twoFactor.enable({
        password,
        method: "totp",
        issuer: "Rurango Studio",
      });
      if (result.error) {
        toast.error(result.error.message ?? "Could not enable MFA.");
        return;
      }
      const data = result.data as {
        totpURI?: string;
        backupCodes?: string[];
      } | null;
      setTotpUri(data?.totpURI ?? null);
      setBackupCodes(data?.backupCodes ?? []);
      toast.info(
        "Scan the TOTP URI with your authenticator, then verify a code to finish.",
        "Almost done",
      );
    });
  }

  function verify() {
    startTransition(async () => {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Invalid code.");
        return;
      }
      toast.success("MFA enabled.", "Security");
      setPassword("");
      setTotpCode("");
      router.refresh();
    });
  }

  function disable() {
    startTransition(async () => {
      const result = await authClient.twoFactor.disable({
        password,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Could not disable MFA.");
        return;
      }
      toast.success("MFA disabled.", "Security");
      setTotpUri(null);
      setBackupCodes([]);
      setPassword("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground-secondary">
        Status:{" "}
        <span className="font-medium text-foreground">
          {enabled ? "Enabled" : "Not enabled"}
        </span>
      </p>

      <div>
        <Label htmlFor="mfa-password">Account password</Label>
        <PasswordInput
          id="mfa-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>

      {!enabled ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={password.length < 8}
            onClick={enable}
          >
            Enable TOTP
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="danger"
          loading={pending}
          disabled={password.length < 8}
          onClick={disable}
        >
          Disable MFA
        </Button>
      )}

      {totpUri ? (
        <div className="space-y-2 rounded-md border border-border p-3 text-sm">
          <p className="font-medium">Authenticator setup</p>
          <p className="break-all font-mono text-xs text-foreground-secondary">
            {totpUri}
          </p>
          {backupCodes.length ? (
            <div>
              <p className="mb-1 text-xs text-foreground-muted">
                Store these backup codes securely:
              </p>
              <ul className="font-mono text-xs">
                {backupCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <Label htmlFor="totp-code">Verification code</Label>
            <Input
              id="totp-code"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              inputMode="numeric"
            />
          </div>
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={totpCode.length < 6}
            onClick={verify}
          >
            Verify and activate
          </Button>
        </div>
      ) : null}
    </div>
  );
}
