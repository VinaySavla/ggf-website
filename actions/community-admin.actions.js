"use server";

import crypto from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyEventRegistrants, createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
import { sendEventReminderEmail } from "@/lib/mail";
import { after } from "next/server";
import { sanitizeRichText } from "@/lib/sanitize";

async function requireAdmin(superOnly = false) {
  const session = await auth();
  if (!session || (superOnly ? session.user.role !== "SUPER_ADMIN" : !["ORGANIZER", "SUPER_ADMIN"].includes(session.user.role))) throw new Error("Unauthorized");
  return session.user;
}

async function canManageEvent(user, eventId, client = prisma) {
  if (user.role === "SUPER_ADMIN") return true;
  return Boolean(await client.event.findFirst({
    where: {
      id: eventId,
      OR: [{ organizerId: user.id }, { tournament: { organizerId: user.id } }],
    },
    select: { id: true },
  }));
}

export async function createAnnouncement(data) {
  try {
    const user = await requireAdmin();
    if (!data.title?.trim() || !data.content?.trim()) return { error: "Title and content are required" };
    if (!["all", "members", "registrants"].includes(data.audience || "all")) return { error: "Invalid audience" };
    if (data.audience === "registrants" && !data.eventId) return { error: "Choose an event for registrant announcements" };
    if (data.eventId && !(await canManageEvent(user, data.eventId))) return { error: "You cannot manage this event" };
    const item = await prisma.announcement.create({ data: { title: data.title.trim(), content: sanitizeRichText(data.content), audience: data.audience || "all", eventId: data.eventId || null, authorId: user.id, expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } });
    if (data.eventId) await notifyEventRegistrants(data.eventId, { type: "announcement", title: item.title, message: item.content.replace(/<[^>]+>/g, "").slice(0, 240), href: `/events/${data.eventSlug || ""}` });
    revalidatePath("/announcements"); revalidatePath("/dashboard");
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function sendEventReminder(eventId, message) {
  try {
    const user = await requireAdmin();
    if (!(await canManageEvent(user, eventId))) return { error: "You cannot manage this event" };
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          where: { status: "active" },
          include: { user: { select: { id: true, email: true, firstName: true, notificationPreferences: true } } },
        },
      },
    });
    if (!event) return { error: "Event not found" };
    const recipients = [...new Map(event.registrations.filter(item => item.user).map(item => [item.user.id, item.user])).values()];
    await prisma.notification.createMany({ data: recipients.filter(member => member.notificationPreferences?.inApp !== false && member.notificationPreferences?.eventReminders !== false).map(member => ({ userId: member.id, type: "event_reminder", title: `Reminder: ${event.title}`, message: message?.trim() || "Your registered event is coming up.", href: `/events/${event.slug}` })) });
    const emailRecipients = recipients.filter(member => member.notificationPreferences?.email !== false && member.notificationPreferences?.eventReminders !== false);
    after(async () => {
      const emailResults = await Promise.allSettled(emailRecipients.map(member => sendEventReminderEmail(member.email, member.firstName, event, message?.trim() || "Your registered event is coming up.")));
      const sent = emailResults.filter(result => result.status === "fulfilled" && result.value.success).length;
      await prisma.auditLog.create({ data: { actorId: user.id, action: "event.reminder_delivery", entityType: "Event", entityId: eventId, metadata: { attempted: emailRecipients.length, sent } } });
    });
    revalidatePath("/notifications");
    return { success: true, recipients: recipients.length, emailsQueued: emailRecipients.length };
  } catch (error) { return { error: error.message }; }
}

export async function reviewOpportunity(id, approved, reason = "") {
  try { const actor = await requireAdmin(true); const item = await prisma.$transaction(async (tx) => { const updated = await tx.opportunity.update({ where: { id }, data: { isApproved: approved, moderationStatus: approved ? "approved" : "rejected", moderationReason: reason.trim() || null, reviewedAt: new Date() } }); await createNotification({ userId: updated.creatorId, type: "moderation", title: `Opportunity ${approved ? "approved" : "rejected"}`, message: approved ? `${updated.title} is now public.` : `${updated.title} was not approved${reason.trim() ? `: ${reason.trim()}` : "."}`, href: "/opportunities?mine=1" }, tx); await tx.auditLog.create({ data: { actorId: actor.id, action: approved ? "opportunity.approved" : "opportunity.rejected", entityType: "Opportunity", entityId: id } }); return updated; }); revalidatePath("/opportunities"); return { success: true, item }; } catch (error) { return { error: error.message }; }
}

export async function reviewBusiness(id, approved, reason = "") {
  try { const actor = await requireAdmin(true); const item = await prisma.$transaction(async (tx) => { const updated = await tx.businessProfile.update({ where: { id }, data: { isApproved: approved, moderationStatus: approved ? "approved" : "rejected", moderationReason: reason.trim() || null, reviewedAt: new Date() } }); await createNotification({ userId: updated.userId, type: "moderation", title: `Business profile ${approved ? "approved" : "rejected"}`, message: approved ? `${updated.name} is now public.` : `${updated.name} was not approved${reason.trim() ? `: ${reason.trim()}` : "."}`, href: "/businesses/manage" }, tx); await tx.auditLog.create({ data: { actorId: actor.id, action: approved ? "business.approved" : "business.rejected", entityType: "BusinessProfile", entityId: id } }); return updated; }); revalidatePath("/businesses"); return { success: true, item }; } catch (error) { return { error: error.message }; }
}

export async function reviewCommunityReport(id, status) {
  try { const actor = await requireAdmin(true); if (!["resolved", "dismissed"].includes(status)) return { error: "Invalid status" }; await prisma.$transaction([prisma.communityReport.update({ where: { id }, data: { status } }), prisma.auditLog.create({ data: { actorId: actor.id, action: `community_report.${status}`, entityType: "CommunityReport", entityId: id } })]); revalidatePath("/admin/community"); return { success: true }; } catch (error) { return { error: error.message }; }
}

export async function createVolunteerOpportunity(data) {
  try { await requireAdmin(true); if (!data.title?.trim() || !data.description?.trim()) return { error: "Title and description are required" }; await prisma.volunteerOpportunity.create({ data: { title: data.title.trim(), description: data.description.trim(), location: data.location?.trim() || null, eventDate: data.eventDate ? new Date(data.eventDate) : null, capacity: data.capacity ? Number(data.capacity) : null } }); revalidatePath("/volunteer"); return { success: true }; } catch (error) { return { error: error.message }; }
}

export async function updateVolunteerApplication(id, status, hoursLogged = null) {
  try { await requireAdmin(true); if (!["accepted", "declined", "completed"].includes(status)) return { error: "Invalid status" }; const application = await prisma.volunteerApplication.update({ where: { id }, data: { status, ...(hoursLogged !== null && hoursLogged !== "" ? { hoursLogged: Number(hoursLogged) } : {}) } }); await createNotification({ userId: application.userId, type: "volunteer", title: "Volunteer application updated", message: `Your volunteer application is now ${status}.`, href: "/volunteer" }); revalidatePath("/admin/volunteers"); return { success: true }; } catch(error){return {error:error.message};}
}

export async function checkInTicket(ticketCode) {
  try {
    const user = await requireAdmin();
    const code = String(ticketCode).replace(/^GGF-TICKET:/, "").trim();
    const registration = await prisma.registration.findUnique({ where: { ticketCode: code }, include: { event: true } });
    if (!registration || registration.paymentStatus !== "paid" || !registration.userId) return { error: "Valid confirmed ticket not found" };
    if (!(await canManageEvent(user, registration.eventId))) return { error: "You cannot check in this event" };
    const attendance = await prisma.eventAttendance.upsert({ where: { userId_eventId: { userId: registration.userId, eventId: registration.eventId } }, update: {}, create: { userId: registration.userId, eventId: registration.eventId, checkedInBy: user.id } });
    await prisma.registration.update({ where: { id: registration.id }, data: { attendanceStatus: "checked_in" } });
    return { success: true, participant: `${registration.userData?.firstName || ""} ${registration.userData?.surname || ""}`.trim(), event: registration.event.title, checkedInAt: attendance.checkedInAt };
  } catch (error) { return { error: error.message }; }
}

export async function issueCertificate({ userId, eventId, title, fileUrl }) {
  try {
    const user = await requireAdmin();
    if (eventId && !(await canManageEvent(user, eventId))) return { error: "You cannot manage this event" };
    if (!title?.trim() || (fileUrl && !String(fileUrl).startsWith("/api/files/certificates/"))) return { error: "Use a certificate uploaded through the secure certificate uploader" };
    const certificate = await prisma.$transaction(async (tx) => {
      const item = await tx.certificate.create({ data: { userId, eventId: eventId || null, title, fileUrl: fileUrl || null, certificateNumber: `GGF-CERT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}` } });
      await createNotification({ userId, type: "certificate", title: "New certificate issued", message: title, href: "/certificates" }, tx); return item;
    });
    revalidatePath("/certificates"); return { success: true, certificate };
  } catch (error) { return { error: error.message }; }
}

export async function saveTournamentMatch(data) {
  try {
    const user = await requireAdmin();
    const tournament = await prisma.tournamentMaster.findUnique({ where: { id: data.tournamentId }, select: { organizerId: true } });
    if (!tournament || (user.role !== "SUPER_ADMIN" && tournament.organizerId !== user.id)) return { error: "Unauthorized" };
    if (data.homeTeamId === data.awayTeamId) return { error: "Select two different teams" };
    const teamIds = [data.homeTeamId, data.awayTeamId, data.winningTeamId].filter(Boolean);
    const validTeamCount = await prisma.team.count({ where: { id: { in: [...new Set(teamIds)] }, tournamentId: data.tournamentId } });
    if (validTeamCount !== new Set(teamIds).size || (data.winningTeamId && ![data.homeTeamId, data.awayTeamId].includes(data.winningTeamId))) return { error: "Every selected team must belong to this tournament and the winner must be a participating team" };
    if (data.id) {
      const existing = await prisma.tournamentMatch.findUnique({ where: { id: data.id }, select: { tournamentId: true } });
      if (!existing || existing.tournamentId !== data.tournamentId) return { error: "Match does not belong to this tournament" };
    }
    const payload = { tournamentId: data.tournamentId, homeTeamId: data.homeTeamId, awayTeamId: data.awayTeamId, winningTeamId: data.winningTeamId || null, scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null, venue: data.venue || null, status: data.status || "scheduled", homeScore: data.homeScore || null, awayScore: data.awayScore || null, resultNote: data.resultNote || null };
    if (data.id) await prisma.tournamentMatch.update({ where: { id: data.id }, data: payload }); else await prisma.tournamentMatch.create({ data: payload });
    revalidatePath(`/admin/tournaments/${data.tournamentId}`); return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function saveStatDefinition(data) {
  try { await requireAdmin(true); const key=data.label.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""); await prisma.sportStatDefinition.upsert({ where: { sportId_key: { sportId: data.sportId, key } }, update: { label: data.label, valueType: data.valueType, sortOrder: Number(data.sortOrder)||0 }, create: { sportId: data.sportId, key, label: data.label, valueType: data.valueType || "number", sortOrder: Number(data.sortOrder)||0 } }); return { success:true }; } catch(error){return {error:error.message};}
}
