"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { optionalHttpUrl } from "@/lib/validation";

async function requireUser() {
  const session = await auth();
  if (!session || session.user.isActive === false) throw new Error("Please sign in with an active account to continue");
  return session.user;
}

export async function toggleBookmark(eventId) {
  try {
    const user = await requireUser();
    const existing = await prisma.eventBookmark.findUnique({ where: { userId_eventId: { userId: user.id, eventId } } });
    if (existing) await prisma.eventBookmark.delete({ where: { id: existing.id } });
    else await prisma.eventBookmark.create({ data: { userId: user.id, eventId } });
    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    return { success: true, bookmarked: !existing };
  } catch (error) {
    return { error: error.message };
  }
}

export async function joinWaitlist(eventId) {
  try {
    const user = await requireUser();
    const entry = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event?.isActive) throw new Error("This event is unavailable");
      const alreadyRegistered = await tx.registration.findFirst({ where: { eventId, userId: user.id, status: "active" } });
      if (alreadyRegistered) throw new Error("You are already registered");
      const activeCount = await tx.registration.count({ where: { eventId, status: "active" } });
      const genderCount = event.registrationCountType === "separate"
        ? await tx.registration.count({ where: { eventId, status: "active", gender: user.gender } }) : 0;
      const genderLimit = user.gender === "Male" ? event.maxMaleRegistrations : user.gender === "Female" ? event.maxFemaleRegistrations : event.maxOtherRegistrations;
      const isFull = event.registrationCountType === "common"
        ? Boolean(event.maxTotalRegistrations && activeCount >= event.maxTotalRegistrations)
        : Boolean(genderLimit && genderCount >= genderLimit);
      if (!isFull) throw new Error("Registration is still available; register directly instead");
      const last = await tx.eventWaitlist.aggregate({ where: { eventId, status: "waiting" }, _max: { position: true } });
      return tx.eventWaitlist.upsert({
        where: { userId_eventId: { userId: user.id, eventId } },
        update: { status: "waiting", position: (last._max.position || 0) + 1, invitedAt: null, inviteExpiresAt: null },
        create: { userId: user.id, eventId, position: (last._max.position || 0) + 1 },
      });
    }, { isolationLevel: "Serializable" });
    revalidatePath("/dashboard");
    return { success: true, position: entry.position };
  } catch (error) {
    return { error: error.message };
  }
}

export async function leaveWaitlist(eventId) {
  try {
    const user = await requireUser();
    await prisma.eventWaitlist.updateMany({ where: { eventId, userId: user.id, status: { in: ["waiting", "invited"] } }, data: { status: "declined" } });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function cancelRegistration(registrationId) {
  try {
    const user = await requireUser();
    const result = await prisma.$transaction(async (tx) => {
      const registration = await tx.registration.findUnique({
        where: { id: registrationId },
        include: { event: true },
      });
      if (!registration || (registration.userId !== user.id && registration.userData?.userId !== user.id)) {
        throw new Error("Registration not found");
      }
      if (registration.status === "cancelled") throw new Error("Registration is already cancelled");
      if (registration.event.eventDate && registration.event.eventDate <= new Date()) {
        throw new Error("Past or started events cannot be cancelled online");
      }
      await tx.registration.update({
        where: { id: registration.id },
        data: { status: "cancelled", canceledAt: new Date(), ticketCode: null },
      });
      if (registration.paymentStatus === "paid") {
        await tx.refundRequest.create({ data: {
          registrationId: registration.id,
          amount: registration.event.paymentAmount,
          reason: "Member cancelled registration",
        } });
      }
      const nextWaiting = await tx.eventWaitlist.findFirst({
        where: { eventId: registration.eventId, status: "waiting" },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      });
      if (nextWaiting) {
        const invitedAt = new Date();
        await tx.eventWaitlist.update({ where: { id: nextWaiting.id }, data: { status: "invited", invitedAt, inviteExpiresAt: new Date(invitedAt.getTime() + 24 * 60 * 60 * 1000) } });
      }
      return { registration, nextWaiting };
    });
    if (result.nextWaiting) {
      await createNotification({
        userId: result.nextWaiting.userId,
        type: "waitlist",
        title: "A place is available",
        message: `A place opened for ${result.registration.event.title}. Register while availability lasts.`,
        href: `/events/${result.registration.event.slug}`,
      });
    }
    revalidatePath("/events");
    revalidatePath("/my-registrations");
    revalidatePath(`/my-registrations/${registrationId}`);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function markNotificationRead(id) {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { isRead: true } });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function markAllNotificationsRead() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    revalidatePath("/notifications");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function submitEventFeedback(eventId, rating, comments) {
  try {
    const user = await requireUser();
    const score = Number(rating);
    if (!Number.isInteger(score) || score < 1 || score > 5) return { error: "Rating must be between 1 and 5" };
    const attended = await prisma.eventAttendance.findUnique({ where: { userId_eventId: { userId: user.id, eventId } } });
    if (!attended) return { error: "Feedback is available after attendance is confirmed" };
    await prisma.eventFeedback.upsert({
      where: { userId_eventId: { userId: user.id, eventId } },
      update: { rating: score, comments: comments?.trim() || null },
      create: { userId: user.id, eventId, rating: score, comments: comments?.trim() || null },
    });
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function submitOpportunity(data) {
  try {
    const user = await requireUser();
    if (!data.title?.trim() || !data.type?.trim() || !data.description?.trim()) return { error: "Title, type and description are required" };
    await prisma.opportunity.create({
      data: {
        title: data.title.trim(), type: data.type.trim(), description: data.description.trim(),
        organization: data.organization?.trim() || null, location: data.location?.trim() || null,
        applyUrl: optionalHttpUrl(data.applyUrl, "Application link"), contactEmail: data.contactEmail?.trim().toLowerCase() || null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null, creatorId: user.id,
        isApproved: user.role === "SUPER_ADMIN", moderationStatus: user.role === "SUPER_ADMIN" ? "approved" : "pending",
      },
    });
    revalidatePath("/opportunities");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function requestMentorship(mentorId, topic, message) {
  try {
    const user = await requireUser();
    if (mentorId === user.id) return { error: "You cannot request yourself as a mentor" };
    if (!topic?.trim()) return { error: "Select a mentorship topic" };
    const mentor = await prisma.user.findFirst({ where: { id: mentorId, isActive: true, isDirectoryVisible: true, isMentorAvailable: true, blocksCreated: { none: { blockedId: user.id } }, blocksReceived: { none: { blockerId: user.id } } }, select: { id: true } });
    if (!mentor) return { error: "This member is not accepting mentorship requests" };
    await prisma.mentorship.create({ data: { mentorId, menteeId: user.id, topic: topic.trim(), message: message?.trim() || null } });
    return { success: true };
  } catch (error) {
    if (error.code === "P2002") return { error: "A request for this topic already exists" };
    return { error: error.message };
  }
}

export async function toggleMemberBlock(blockedId) {
  try {
    const user = await requireUser();
    if (blockedId === user.id) return { error: "You cannot block yourself" };
    const existing = await prisma.memberBlock.findUnique({ where: { blockerId_blockedId: { blockerId: user.id, blockedId } } });
    if (existing) await prisma.memberBlock.delete({ where: { id: existing.id } }); else await prisma.memberBlock.create({ data: { blockerId: user.id, blockedId } });
    revalidatePath(`/user/${blockedId}`); revalidatePath("/directory");
    return { success: true, blocked: !existing };
  } catch (error) { return { error: error.message }; }
}

export async function reportMember(subjectUserId, category, details) {
  try {
    const user = await requireUser();
    if (subjectUserId === user.id || !["spam", "harassment", "misrepresentation", "other"].includes(category)) return { error: "Invalid report" };
    await prisma.communityReport.create({ data: { reporterId: user.id, subjectUserId, category, details: String(details || "").trim().slice(0, 1000) || null } });
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function updateMentorshipStatus(id, status) {
  try {
    const user = await requireUser();
    if (!["accepted", "declined", "completed", "cancelled"].includes(status)) return { error: "Invalid status" };
    const request = await prisma.mentorship.findUnique({ where: { id } });
    if (!request || (request.mentorId !== user.id && request.menteeId !== user.id)) return { error: "Unauthorized" };
    if (["accepted", "declined"].includes(status) && request.mentorId !== user.id) return { error: "Only the mentor can respond" };
    await prisma.mentorship.update({ where: { id }, data: { status } });
    revalidatePath("/mentorship/requests");
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function saveBusinessProfile(data) {
  try {
    const user = await requireUser();
    if (!data.name?.trim() || !data.category?.trim()) return { error: "Business name and category are required" };
    const businessData = {
      name: data.name.trim(),
      category: data.category.trim(),
      description: data.description?.trim() || null,
      website: optionalHttpUrl(data.website, "Website"),
      phone: data.phone?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      logoUrl: data.logoUrl?.trim() || null,
      moderationStatus: "pending",
      moderationReason: null,
      reviewedAt: null,
    };
    await prisma.businessProfile.upsert({
      where: { userId: user.id },
      update: { ...businessData, isApproved: false },
      create: { ...businessData, userId: user.id },
    });
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function applyToVolunteer(opportunityId, message) {
  try {
    const user = await requireUser();
    const opportunity = await prisma.volunteerOpportunity.findUnique({ where: { id: opportunityId }, select: { id: true, isActive: true, capacity: true } });
    if (!opportunity?.isActive) return { error: "This opportunity is unavailable" };
    const activeApplications = await prisma.volunteerApplication.count({ where: { opportunityId, status: { in: ["applied", "accepted", "completed"] } } });
    if (opportunity.capacity && activeApplications >= opportunity.capacity) return { error: "Volunteer capacity has been reached" };
    await prisma.volunteerApplication.create({ data: { opportunityId, userId: user.id, message: message?.trim() || null } });
    revalidatePath("/volunteer");
    return { success: true };
  } catch (error) {
    if (error.code === "P2002") return { error: "You have already volunteered" };
    return { error: error.message };
  }
}
