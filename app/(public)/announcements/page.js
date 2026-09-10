import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeRichText } from "@/lib/sanitize";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function AnnouncementsPage() {
  const session = await auth();
  const memberEventFilter = session ? {
    OR: [
      { audience: "all" },
      { audience: "members" },
      { event: { registrations: { some: { userId: session.user.id, status: "active" } } } },
    ],
  } : { audience: "all", eventId: null };
  const items = await prisma.announcement.findMany({ where: { isActive: true, AND: [memberEventFilter, { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }] }, include: { event: { select: { title: true, slug: true } } }, orderBy: { publishedAt: "desc" }, take: 100 });
  return <div className="py-12"><div className="container-custom max-w-4xl"><h1 className="text-3xl font-bold">Announcements</h1><div className="space-y-5 mt-8">{items.map((item) => <article key={item.id} className="border rounded-xl p-6"><p className="text-xs text-gray-500">{formatDate(item.publishedAt)}{item.event ? ` · ${item.event.title}` : ""}</p><h2 className="font-bold text-xl mt-2">{item.title}</h2><div className="prose mt-3" dangerouslySetInnerHTML={{ __html: sanitizeRichText(item.content) }}/></article>)}{!items.length && <p className="text-gray-500">No active announcements.</p>}</div></div></div>;
}
