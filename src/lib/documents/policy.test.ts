import { afterEach, describe, expect, it } from "vitest";
import {
  assertAllowedUpload,
  formatBytes,
  getAllowedMimeTypes,
  getUploadMaxBytes,
  isPreviewableMime,
} from "@/lib/documents/policy";

const ORIGINAL_MAX = process.env.UPLOAD_MAX_BYTES;
const ORIGINAL_MIME = process.env.UPLOAD_ALLOWED_MIME;

afterEach(() => {
  if (ORIGINAL_MAX === undefined) delete process.env.UPLOAD_MAX_BYTES;
  else process.env.UPLOAD_MAX_BYTES = ORIGINAL_MAX;
  if (ORIGINAL_MIME === undefined) delete process.env.UPLOAD_ALLOWED_MIME;
  else process.env.UPLOAD_ALLOWED_MIME = ORIGINAL_MIME;
});

describe("upload policy", () => {
  it("reads max bytes with a safe default", () => {
    delete process.env.UPLOAD_MAX_BYTES;
    expect(getUploadMaxBytes()).toBe(26_214_400);
    process.env.UPLOAD_MAX_BYTES = "1024";
    expect(getUploadMaxBytes()).toBe(1024);
  });

  it("parses allowed MIME list", () => {
    process.env.UPLOAD_ALLOWED_MIME = "application/pdf, image/png ";
    expect(getAllowedMimeTypes()).toEqual(["application/pdf", "image/png"]);
  });

  it("rejects disallowed or oversized files", () => {
    process.env.UPLOAD_ALLOWED_MIME = "application/pdf";
    process.env.UPLOAD_MAX_BYTES = "100";
    expect(() =>
      assertAllowedUpload({ mimeType: "text/plain", byteSize: 10 }),
    ).toThrow(/not allowed/i);
    expect(() =>
      assertAllowedUpload({ mimeType: "application/pdf", byteSize: 0 }),
    ).toThrow(/empty/i);
    expect(() =>
      assertAllowedUpload({ mimeType: "application/pdf", byteSize: 200 }),
    ).toThrow(/exceeds/i);
    expect(() =>
      assertAllowedUpload({ mimeType: "application/pdf", byteSize: 50 }),
    ).not.toThrow();
  });
});

describe("preview helpers", () => {
  it("marks common previewable types", () => {
    expect(isPreviewableMime("image/png")).toBe(true);
    expect(isPreviewableMime("application/pdf")).toBe(true);
    expect(isPreviewableMime("application/msword")).toBe(false);
  });

  it("formats byte sizes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2.0 KB");
    expect(formatBytes(2 * 1024 * 1024)).toBe("2.0 MB");
  });
});
