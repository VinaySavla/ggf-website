import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CommunityManager from "@/components/admin/CommunityManager";

export const dynamic = "force-dynamic";
export default async function AdminCommunityPage() {
  const session = await auth();
  if (!session || !["ORGANIZER", "SUPER_ADMIN"].includes(session.user.role)) redirect("/admin");
  const isSuper = session.user.role === "SUPER_ADMIN";
  const eventWhere = { isActive: true, ...(isSuper ? {} : { OR: [{ organizerId: session.user.id }, { tournament: { organizerId: session.user.id } }] }) };
  const empty = Promise.resolve([]);
  const [events, opportunities, businesses, volunteers, reports] = await Promise.all([
    prisma.event.findMany({ where: eventWhere, select: { id: true, title: true }, orderBy: { eventDate: "desc" }, take: 200 }),
    isSuper ? prisma.opportunity.findMany({ where: { moderationStatus: "pending" }, include: { creator: { select: { firstName: true, surname: true } } }, orderBy: { createdAt: "asc" }, take: 200 }) : empty,
    isSuper ? prisma.businessProfile.findMany({ where: { moderationStatus: "pending" }, include: { user: { select: { firstName: true, surname: true } } }, orderBy: { createdAt: "asc" }, take: 200 }) : empty,
    isSuper ? prisma.volunteerApplication.findMany({ include: { user: { select: { firstName: true, surname: true } }, opportunity: { select: { title: true } } }, orderBy: { createdAt: "desc" }, take: 100 }) : empty,
    isSuper ? prisma.communityReport.findMany({ where: { status: "open" }, include: { reporter: { select: { firstName: true, surname: true } }, subjectUser: { select: { firstName: true, surname: true } } }, orderBy: { createdAt: "asc" }, take: 100 }) : empty,
  ]);
  return <div><h1 className="text-2xl font-bold">{isSuper ? "Community management" : "Event operations"}</h1><p className="text-gray-600 mt-1 mb-6">Publish event updates, send reminders and check in attendees.{isSuper ? " Super admins can also moderate community submissions and reports." : ""}</p><CommunityManager events={events} opportunities={opportunities} businesses={businesses} volunteers={volunteers} reports={reports} isSuper={isSuper}/></div>;
}
