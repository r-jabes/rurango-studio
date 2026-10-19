"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import {
  IMAGE_UPLOAD_MIME_TYPES,
  assertAllowedUpload,
} from "@/lib/documents/policy";
import { requireRole } from "@/lib/session";
import {
  buildPublicMediaObjectKey,
  getStorage,
} from "@/lib/storage";

export type UploadedMedia = {
  key: string;
  url: string;
  contentType: string;
  byteSize: number;
};

/**
 * Upload an image to publicly readable media storage.
 * Returns a Studio URL suitable for cover/preview fields and CMS paths.
 */
export async function uploadPublicImageAction(
  formData: FormData,
): Promise<ActionResult<UploadedMedia>> {
  await requireRole(["owner", "member"]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose an image file to upload.");
  }

  try {
    assertAllowedUpload({
      mimeType: file.type,
      byteSize: file.size,
      allowedMimeTypes: [...IMAGE_UPLOAD_MIME_TYPES],
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Invalid image.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = buildPublicMediaObjectKey(file.name);
  await getStorage().putObject({
    key,
    body: buffer,
    contentType: file.type,
  });

  return ok(
    {
      key,
      url: `/api/media/${key}`,
      contentType: file.type,
      byteSize: file.size,
    },
    "Image uploaded.",
  );
}
