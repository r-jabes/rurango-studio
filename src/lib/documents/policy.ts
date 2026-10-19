export function getUploadMaxBytes() {
  const raw = process.env.UPLOAD_MAX_BYTES;
  const value = raw ? Number(raw) : 26_214_400;
  return Number.isFinite(value) && value > 0 ? value : 26_214_400;
}

export function getAllowedMimeTypes() {
  const raw =
    process.env.UPLOAD_ALLOWED_MIME ??
    "application/pdf,image/png,image/jpeg,image/webp,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function assertAllowedUpload(input: {
  mimeType: string;
  byteSize: number;
  /** Restrict to a narrower allow-list (e.g. images only). */
  allowedMimeTypes?: string[];
}) {
  const allowed = (
    input.allowedMimeTypes ?? getAllowedMimeTypes()
  ).map((item) => item.toLowerCase());
  const mime = input.mimeType.toLowerCase();
  if (!allowed.includes(mime)) {
    throw new Error(
      `File type “${input.mimeType}” is not allowed. Allowed: ${allowed.join(", ")}.`,
    );
  }
  const max = getUploadMaxBytes();
  if (input.byteSize <= 0) {
    throw new Error("File is empty.");
  }
  if (input.byteSize > max) {
    throw new Error(
      `File exceeds the ${Math.round(max / (1024 * 1024))} MB upload limit.`,
    );
  }
}

export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export function isPreviewableMime(mimeType: string) {
  return (
    mimeType.startsWith("image/") ||
    mimeType === "application/pdf" ||
    mimeType === "text/plain"
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
