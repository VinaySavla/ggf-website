import path from "path";

export const UPLOAD_FOLDERS = Object.freeze({
  profiles: { public: true, types: ["image/jpeg", "image/png", "image/webp"], maxMb: 5 },
  payments: { public: false, types: ["image/jpeg", "image/png", "image/webp"], maxMb: 5 },
  gallery: { public: true, types: ["image/jpeg", "image/png", "image/webp"], maxMb: 10, adminOnly: true },
  teams: { public: true, types: ["image/jpeg", "image/png", "image/webp"], maxMb: 5, adminOnly: true },
  events: { public: true, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"], maxMb: 10, adminOnly: true },
  "registration-files": { public: false, types: ["image/jpeg", "image/png", "image/webp", "application/pdf"], maxMb: 10 },
  certificates: { public: false, types: ["application/pdf"], maxMb: 10, adminOnly: true },
});

const FILE_SIGNATURES = Object.freeze({
  "image/jpeg": (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  "image/png": (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (buffer) => buffer.length >= 12 && buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP",
  "application/pdf": (buffer) => buffer.length >= 5 && buffer.subarray(0, 5).toString() === "%PDF-",
});

export const EXTENSION_BY_TYPE = Object.freeze({
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
});

export function sanitizeFilename(name = "file") {
  const safe = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe.replace(/^\.+/, "") || "file";
}

export function normalizeUploadFolder(folder = "") {
  const normalized = String(folder).replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const segments = normalized.split("/").filter(Boolean);
  const root = segments[0];
  if (!root || !UPLOAD_FOLDERS[root] || segments.some((part) => part === ".." || !/^[a-zA-Z0-9_-]+$/.test(part))) {
    throw new Error("Invalid upload folder");
  }
  return { folder: segments.join("/"), policy: UPLOAD_FOLDERS[root] };
}

export function resolveStoragePath(relativePath) {
  const storageRoot = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || path.join(process.cwd(), "storage"));
  const clean = String(relativePath).replace(/^\/+/, "").replace(/\\/g, "/");
  const resolved = path.resolve(storageRoot, clean);
  if (resolved !== storageRoot && !resolved.startsWith(`${storageRoot}${path.sep}`)) {
    throw new Error("Path escapes upload storage");
  }
  return resolved;
}

export function validateUpload(file, policy) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file provided");
  if (!policy.types.includes(file.type)) throw new Error("Unsupported file type");
  if (file.size > policy.maxMb * 1024 * 1024) throw new Error(`File size must be less than ${policy.maxMb}MB`);
}

export function validateFileContents(buffer, claimedType, policy) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error("The uploaded file is empty");
  if (!policy.types.includes(claimedType) || !FILE_SIGNATURES[claimedType]?.(buffer)) {
    throw new Error("File contents do not match an allowed image or PDF format");
  }
  return { contentType: claimedType, extension: EXTENSION_BY_TYPE[claimedType] };
}
