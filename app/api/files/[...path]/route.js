import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveStoragePath, UPLOAD_FOLDERS } from "@/lib/upload-policy";

const TYPES = Object.freeze({
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".pdf": "application/pdf",
});

async function mayReadPrivateFile(actualPath, root) {
  const session = await auth();
  if (!session?.user?.id || session.user.isActive === false) return false;
  if (session.user.role === "SUPER_ADMIN") return true;

  const ownerSegment = actualPath.split("/")[1];
  if ((root === "payments" || root === "registration-files") && ownerSegment === session.user.id) return true;

  const url = `/api/files/${actualPath}`;
  if (root === "certificates") {
    return Boolean(await prisma.certificate.findFirst({ where: { fileUrl: url, OR: [{ userId: session.user.id }, { event: { OR: [{ organizerId: session.user.id }, { tournament: { organizerId: session.user.id } }] } }] }, select: { id: true } }));
  }
  if (root === "payments") {
    return Boolean(await prisma.registration.findFirst({ where: { paymentSs: url, OR: [{ userId: session.user.id }, { event: { OR: [{ organizerId: session.user.id }, { tournament: { organizerId: session.user.id } }, { financeAssignments: { some: { reviewerId: session.user.id, isActive: true } } }] } }] }, select: { id: true } }));
  }
  if (root === "registration-files") {
    const eventSlug = actualPath.split("/")[2];
    return Boolean(await prisma.registration.findFirst({ where: { userId: ownerSegment, event: { slug: eventSlug, OR: [{ organizerId: session.user.id }, { tournament: { organizerId: session.user.id } }] } }, select: { id: true } }));
  }
  return false;
}

export async function GET(_request, { params }) {
  try {
    const { path: segments } = await params;
    if (!Array.isArray(segments) || segments.some((part) => !part || part.startsWith(".") || !/^[a-zA-Z0-9._-]+$/.test(part))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const actualPath = segments.join("/");
    const root = segments[0];
    const policy = UPLOAD_FOLDERS[root];
    const extension = path.extname(actualPath).toLowerCase();
    const contentType = TYPES[extension];
    if (!policy || !contentType || !policy.types.includes(contentType)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!policy.public && !(await mayReadPrivateFile(actualPath, root))) {
      return NextResponse.json({ error: "Sign in or request access to view this file" }, { status: 403 });
    }

    const absolutePath = resolveStoragePath(actualPath);
    await stat(absolutePath);
    const file = await readFile(absolutePath);
    const isPrivate = !policy.public;
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": contentType === "application/pdf" ? "sandbox" : "default-src 'none'",
        "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Disposition": contentType === "application/pdf" ? `inline; filename="${path.basename(actualPath)}"` : "inline",
      },
    });
  } catch (error) {
    if (error?.code === "ENOENT") return NextResponse.json({ error: "File not found" }, { status: 404 });
    console.error("File serve error", { message: error?.message });
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
