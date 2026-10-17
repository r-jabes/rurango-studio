"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBanner } from "@/components/ui/status-banner";
import { Textarea } from "@/components/ui/textarea";
import type { CommercialDocStatus } from "@/lib/commercial/meta";
import {
  canIssue,
  canMarkResponse,
  canRecordSignedCopy,
  canVoid,
} from "@/lib/commercial/meta";
import {
  issueCommercialDocumentAction,
  markCommercialStatusAction,
  uploadSignedCopyAction,
  voidCommercialDocumentAction,
} from "@/server/commercial/actions";

type DocumentActionsProps = {
  documentId: string;
  status: CommercialDocStatus;
  type: string;
  hasSignedCopy: boolean;
};

export function DocumentActions({
  documentId,
  status,
  type,
  hasSignedCopy,
}: DocumentActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState("");

  function run(action: () => Promise<{ ok: boolean; message?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.message ?? "Action failed.");
        return;
      }
      setMessage(result.message ?? "Done.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground-secondary">
        Actions
      </h2>
      {error ? <StatusBanner tone="danger">{error}</StatusBanner> : null}
      {message ? <StatusBanner tone="success">{message}</StatusBanner> : null}

      <div className="flex flex-wrap gap-2">
        {canIssue(status) ? (
          <Button
            disabled={pending}
            onClick={() => run(() => issueCommercialDocumentAction(documentId))}
          >
            Issue document
          </Button>
        ) : null}

        {canMarkResponse(status) ? (
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("status", "accepted");
                run(() => markCommercialStatusAction(documentId, fd));
              }}
            >
              Mark accepted
            </Button>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("status", "declined");
                run(() => markCommercialStatusAction(documentId, fd));
              }}
            >
              Mark declined
            </Button>
          </>
        ) : null}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.open(`/api/commercial/${documentId}/pdf`, "_blank");
          }}
        >
          Download PDF
        </Button>
      </div>

      {canVoid(status) ? (
        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor="voidReason">Void reason</Label>
          <Textarea
            id="voidReason"
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            rows={2}
            placeholder="Why this document is being voided"
          />
          <Button
            variant="danger"
            disabled={pending || voidReason.trim().length < 3}
            onClick={() => {
              const fd = new FormData();
              fd.set("reason", voidReason);
              run(() => voidCommercialDocumentAction(documentId, fd));
            }}
          >
            Void document
          </Button>
          <p className="text-xs text-foreground-secondary">
            Voiding preserves the issued snapshot. Create a new draft to reissue.
          </p>
        </div>
      ) : null}

      {type === "agreement" && canRecordSignedCopy(status) ? (
        <form
          className="space-y-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            const fd = new FormData(event.currentTarget);
            run(() => uploadSignedCopyAction(documentId, fd));
          }}
        >
          <h3 className="text-sm font-medium">Record signed copy</h3>
          <p className="text-xs text-foreground-secondary">
            Upload a signed PDF or image and record who signed. This is{" "}
            <strong>not</strong> a legally binding electronic signature workflow.
          </p>
          <div>
            <Label htmlFor="signedByName">Signed by</Label>
            <Input id="signedByName" name="signedByName" required />
          </div>
          <div>
            <Label htmlFor="signedAt">Signed at</Label>
            <Input id="signedAt" name="signedAt" type="datetime-local" />
          </div>
          <div>
            <Label htmlFor="signedNotes">Notes</Label>
            <Input id="signedNotes" name="signedNotes" />
          </div>
          <div>
            <Label htmlFor="file">Signed file</Label>
            <Input id="file" name="file" type="file" required />
          </div>
          {hasSignedCopy ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="replaceExisting" value="true" />
              Replace existing signed copy (audited)
            </label>
          ) : null}
          <Button type="submit" variant="secondary" disabled={pending}>
            Upload signed copy
          </Button>
        </form>
      ) : null}
    </div>
  );
}
