import crypto from "crypto";
import { authSecret } from "@/lib/secrets";

export function createVerificationToken(payload, expiresInMs = 365 * 24 * 60 * 60 * 1000) {
  const encoded = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + expiresInMs })).toString("base64url");
  const signature = crypto.createHmac("sha256", authSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function readVerificationToken(token) {
  try {
    const [encoded, signature] = String(token || "").split(".");
    if (!encoded || !signature) return null;
    const expected = crypto.createHmac("sha256", authSecret()).update(encoded).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return value.exp > Date.now() ? value : null;
  } catch { return null; }
}
