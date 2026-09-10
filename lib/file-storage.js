import { mkdir, unlink, writeFile } from "fs/promises";
import { resolveStoragePath } from "@/lib/upload-policy";

/**
 * Storage boundary used by uploads and deletion. Local storage remains the
 * default, while a future object-storage adapter can implement this contract
 * without changing registration, gallery, event, or payment workflows.
 */
function configuredProvider() {
  return (process.env.FILE_STORAGE_PROVIDER || "local").toLowerCase();
}

function assertLocalProvider() {
  const provider = configuredProvider();
  if (provider !== "local") {
    throw new Error(`File storage provider "${provider}" is not configured`);
  }
}

export async function storeFile({ folder, filename, buffer }) {
  assertLocalProvider();
  const uploadDir = resolveStoragePath(folder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(resolveStoragePath(`${folder}/${filename}`), buffer, { flag: "wx" });
  return {
    provider: "local",
    key: `${folder}/${filename}`,
    url: `/api/files/${folder}/${filename}`,
  };
}

export async function deleteStoredFile(fileUrl) {
  assertLocalProvider();
  const pathname = fileUrl.startsWith("/api/files/")
    ? fileUrl.slice("/api/files/".length)
    : fileUrl.replace(/^\/+/, "");
  await unlink(resolveStoragePath(pathname));
}
