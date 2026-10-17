type DocumentPreviewProps = {
  title?: string;
  mimeType?: string | null;
};

/** Placeholder preview surface — real previews land with the document vault. */
export function DocumentPreview({
  title = "No document selected",
  mimeType,
}: DocumentPreviewProps) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background-secondary px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-foreground-secondary">
        {mimeType
          ? `Preview support for ${mimeType} will be enabled when the vault ships.`
          : "Authorized document previews will appear here in a later phase."}
      </p>
    </div>
  );
}
