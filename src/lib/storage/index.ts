import { createLocalStorage } from "@/lib/storage/local";
import { createS3Storage } from "@/lib/storage/s3";
import type { StorageDriver } from "@/lib/storage/types";

let cached: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (cached) return cached;

  const driver = (process.env.STORAGE_DRIVER ?? "local").toLowerCase();
  if (driver === "s3") {
    cached = createS3Storage();
    return cached;
  }
  if (driver === "local") {
    cached = createLocalStorage();
    return cached;
  }
  throw new Error(`Unsupported STORAGE_DRIVER: ${driver}`);
}

export {
  buildVaultObjectKey,
  checksumSha256,
} from "@/lib/storage/local";
