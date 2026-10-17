"use client";

import { useState } from "react";

type DocumentPreviewProps = {
  title?: string;
  mimeType?: string | null;
  documentId?: string;
  versionId?: string | null;
};

function PreviewBody({
  title,
  mimeType,
  documentId,
  versionId,
}: {
  title: string;
  mimeType: string;
  documentId: string;
  versionId?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const src = `/api/documents/${documentId}/download?inline=1${
    versionId ? `&versionId=${versionId}` : ""
  }`;

  if (failed) {
    return (
      <div className="rounded-xl border border-border bg-background-secondary px-6 py-10 text-center text-sm text-foreground-secondary">
        Preview unavailable for this file. Use download instead.
      </div>
    );
  }

  if (mimeType.startsWith("image/")) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title}
        className="max-h-[28rem] w-full rounded-xl border border-border object-contain bg-background"
        onError={() => setFailed(true)}
      />
    );
  }

  if (mimeType === "application/pdf" || mimeType === "text/plain") {
    return (
      <iframe
        title={title}
        src={src}
        className={
          mimeType === "application/pdf"
            ? "h-[28rem] w-full rounded-xl border border-border bg-background"
            : "h-64 w-full rounded-xl border border-border bg-background"
        }
      />
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-background-secondary px-6 py-10 text-center text-sm text-foreground-secondary">
      No inline preview for {mimeType}. Download the file to open it.
    </div>
  );
}

export function DocumentPreview({
  title = "No document selected",
  mimeType,
  documentId,
  versionId,
}: DocumentPreviewProps) {
  if (!documentId || !mimeType) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background-secondary px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 max-w-sm text-sm text-foreground-secondary">
          Authorized previews appear here for images, PDFs, and plain text.
        </p>
      </div>
    );
  }

  return (
    <PreviewBody
      key={`${documentId}:${versionId ?? "current"}:${mimeType}`}
      title={title}
      mimeType={mimeType}
      documentId={documentId}
      versionId={versionId}
    />
  );
}
