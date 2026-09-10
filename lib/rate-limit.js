import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function checkRateLimit(scope, identity, limit, windowMs) {
  const key = crypto.createHash("sha256").update(`${scope}:${String(identity || "anonymous").toLowerCase()}`).digest("hex");
  const now = new Date();
  if (key.startsWith("00")) {
    prisma.rateLimitBucket.deleteMany({ where: { updatedAt: { lt: new Date(now.getTime() - 48 * 60 * 60 * 1000) } } }).catch(() => {});
  }
  const cutoff = new Date(now.getTime() - windowMs);
  const current = await prisma.rateLimitBucket.findUnique({ where: { key } });
  if (!current || current.windowStart < cutoff) {
    await prisma.rateLimitBucket.upsert({ where: { key }, update: { count: 1, windowStart: now }, create: { key, count: 1, windowStart: now } });
    return;
  }
  const updated = await prisma.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  if (updated.count > limit) throw new Error("Too many attempts. Please wait and try again.");
}
