import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "@/lib/storage/types";

function rootDir() {
  return (
    process.env.LOCAL_STORAGE_PATH?.trim() ||
    path.join(process.cwd(), ".data", "vault")
  );
}

export function createLocalStorage(): StorageDriver {
  return {
    async putObject({ key, body }) {
      const absolute = path.join(rootDir(), key);
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, body);
      return { key, byteSize: body.byteLength };
    },
    async getObject(key) {
      const absolute = path.join(rootDir(), key);
      const body = await readFile(absolute);
      return { body };
    },
    async deleteObject(key) {
      const absolute = path.join(rootDir(), key);
      await unlink(absolute).catch(() => undefined);
    },
  };
}

export function buildVaultObjectKey(originalFilename: string) {
  const safeExt = path.extname(originalFilename).slice(0, 20).toLowerCase();
  return `vault/${randomUUID()}/${randomUUID()}${safeExt}`;
}

export function checksumSha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
