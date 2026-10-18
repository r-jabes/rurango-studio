"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { StatusBanner } from "@/components/ui/status-banner";
import { authClient } from "@/lib/auth-client";

type MfaPanelProps = {
  enabled: boolean;
};

export function MfaPanel({ enabled }: MfaPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function enable() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await authClient.twoFactor.enable({
        password,
        method: "totp",
        issuer: "Rurango Studio",
      });
      if (result.error) {
        setError(result.error.message ?? "Could not enable MFA.");
        return;
      }
      const data = result.data as {
        totpURI?: string;
        backupCodes?: string[];
      } | null;
      setTotpUri(data?.totpURI ?? null);
      setBackupCodes(data?.backupCodes ?? []);
      setMessage(
        "Scan the TOTP URI with your authenticator, then verify a code to finish.",
      );
    });
  }

  function verify() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await authClient.twoFactor.verifyTotp({
        code: totpCode,
      });
      if (result.error) {
        setError(result.error.message ?? "Invalid code.");
        return;
      }
      setMessage("MFA enabled.");
      setPassword("");
      setTotpCode("");
      router.refresh();
    });
  }

  function disable() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await authClient.twoFactor.disable({
        password,
      });
      if (result.error) {
        setError(result.error.message ?? "Could not disable MFA.");
        return;
      }
      setMessage("MFA disabled.");
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
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

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
            disabled={pending || password.length < 8}
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
          disabled={pending || password.length < 8}
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
            disabled={pending || totpCode.length < 6}
            onClick={verify}
          >
            Verify and activate
          </Button>
        </div>
      ) : null}
    </div>
  );
}
