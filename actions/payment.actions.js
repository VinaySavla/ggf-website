"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromStorage, deleteMultipleFilesFromStorage } from "@/lib/storage";
import { normalizeManualPayment } from "@/lib/payment-provider";
import { createNotification } from "@/lib/notifications";
import { canManageEvent, canReviewEventPayments } from "@/lib/event-permissions";
import { revalidatePath } from "next/cache";

export async function submitPaymentProof(data) {
  try {
    const session = await auth();

    if (!session || session.user.isActive === false) {
      return { error: "Unauthorized" };
    }

    const { registrationId, transactionId, screenshotUrl } = data;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return { error: "Registration not found" };
    }

    const legacyUserId = registration.userData?.userId;
    if (registration.userId !== session.user.id && legacyUserId !== session.user.id) {
      return { error: "You can only update payment proof for your own registration" };
    }

    if (registration.paymentStatus === "paid") {
      return { error: "Payment already verified" };
    }

    const payment = normalizeManualPayment({ transactionId, screenshotUrl });
    if (!payment.screenshotUrl.startsWith(`/api/files/payments/${session.user.id}/`)) return { error: "Upload payment proof through the secure payment form" };
    const duplicate = await prisma.registration.findFirst({
      where: { id: { not: registrationId }, paymentProvider: "manual", paymentReference: { equals: payment.reference, mode: "insensitive" } },
      select: { id: true },
    });
    if (duplicate) { await deleteFileFromStorage(payment.screenshotUrl); return { error: "This transaction ID / UTR has already been submitted" }; }
    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        transactionId: payment.reference,
        paymentReference: payment.reference,
        paymentSs: payment.screenshotUrl,
        paymentProvider: payment.provider,
        paymentMetadata: payment.metadata,
        paymentStatus: "pending",
        rejectionReason: null,
      },
    });
    if (registration.paymentSs && registration.paymentSs !== payment.screenshotUrl) await deleteFileFromStorage(registration.paymentSs);
    return { success: true };
  } catch (error) {
    console.error("Payment proof error:", error);
    return { error: "Failed to submit payment proof. Please try again." };
  }
}

export async function updatePaymentStatus(registrationId, status, rejectionReason = null) {
  try {
    const session = await auth();

    if (!session || session.user.isActive === false) {
      return { error: "Unauthorized" };
    }

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        event: {
          include: {
            tournament: true,
          },
        },
      },
    });

    if (!registration) {
      return { error: "Registration not found" };
    }

    if (!(await canReviewEventPayments(registration.eventId, session.user))) {
      return { error: "You don't have permission to update this registration" };
    }

    if (!["paid", "rejected"].includes(status)) return { error: "Invalid payment status" };
    if (status === 'rejected' && !rejectionReason?.trim()) return { error: "A rejection reason is required" };
    if (registration.event.isPaid && (!registration.paymentReference || !registration.paymentSs)) {
      return { error: "A transaction ID and payment screenshot are required before review" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.registration.update({
      where: { id: registrationId },
      data: {
        paymentStatus: status,
        rejectionReason: status === 'rejected' ? rejectionReason.trim() : null,
        reviewedAt: new Date(),
        reviewedById: session.user.id,
      },
      });
      await tx.paymentReview.create({ data: {
        registrationId, actorId: session.user.id, fromStatus: registration.paymentStatus,
        toStatus: status, reason: status === "rejected" ? rejectionReason.trim() : null,
      } });
      const registrationUserId = registration.userId || registration.userData?.userId;
      await createNotification({
        userId: registrationUserId,
        type: "payment",
        title: status === "paid" ? "Payment approved" : "Payment needs attention",
        message: status === "paid"
          ? `Your payment for ${registration.event.title} has been approved.`
          : `Your payment for ${registration.event.title} was rejected: ${rejectionReason}`,
        href: `/my-registrations/${registrationId}`,
      }, tx);
    });

    return { success: true };
  } catch (error) {
    console.error("Update payment status error:", error);
    return { error: "Failed to update payment status. Please try again." };
  }
}

export async function approvePayment(registrationId) {
  return updatePaymentStatus(registrationId, "paid");
}

export async function rejectPayment(registrationId) {
  return updatePaymentStatus(registrationId, "rejected");
}

export async function assignFinanceReviewer(eventId, formData) {
  try {
    const session = await auth();
    if (!session || !(await canManageEvent(eventId, session.user))) return { error: "Unauthorized" };
    const reviewerId = String(formData.get("reviewerId") || "");
    const reviewer = await prisma.user.findFirst({ where: { id: reviewerId, isActive: true }, select: { id: true } });
    if (!reviewer) return { error: "Select an active member" };
    await prisma.eventFinanceAssignment.upsert({
      where: { eventId_reviewerId: { eventId, reviewerId } },
      update: { isActive: true, assignedById: session.user.id },
      create: { eventId, reviewerId, assignedById: session.user.id },
    });
    if (reviewerId !== session.user.id) {
      await prisma.user.updateMany({ where: { id: reviewerId, role: "USER" }, data: { role: "FINANCE_REVIEWER" } });
    }
    revalidatePath(`/admin/events/${eventId}/edit`);
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function removeFinanceReviewer(eventId, reviewerId) {
  try {
    const session = await auth();
    if (!session || !(await canManageEvent(eventId, session.user))) return { error: "Unauthorized" };
    await prisma.eventFinanceAssignment.updateMany({ where: { eventId, reviewerId }, data: { isActive: false } });
    const remaining = await prisma.eventFinanceAssignment.count({ where: { reviewerId, isActive: true } });
    if (remaining === 0) await prisma.user.updateMany({ where: { id: reviewerId, role: "FINANCE_REVIEWER" }, data: { role: "USER" } });
    revalidatePath(`/admin/events/${eventId}/edit`);
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function updateRefundStatus(refundId, status, reference = "") {
  try {
    const session = await auth();
    if (!session || !["approved", "rejected", "completed"].includes(status)) return { error: "Unauthorized or invalid status" };
    const refund = await prisma.refundRequest.findUnique({ where: { id: refundId }, include: { registration: { include: { event: true } } } });
    if (!refund || !(await canReviewEventPayments(refund.registration.eventId, session.user))) return { error: "Refund request not found" };
    if (status === "completed" && !reference.trim()) return { error: "A refund transaction reference is required" };
    await prisma.$transaction(async (tx) => {
      await tx.refundRequest.update({ where: { id: refundId }, data: {
        status, reference: reference.trim() || null, reviewedById: session.user.id,
        reviewedAt: new Date(), completedAt: status === "completed" ? new Date() : null,
      } });
      const userId = refund.registration.userId || refund.registration.userData?.userId;
      if (userId) await createNotification({
        userId, type: "refund", title: `Refund ${status}`,
        message: status === "completed" ? `Your refund for ${refund.registration.event.title} has been completed. Reference: ${reference.trim()}` : `Your refund for ${refund.registration.event.title} is ${status}.`,
        href: `/my-registrations/${refund.registrationId}`,
      }, tx);
    });
    revalidatePath("/admin/refunds");
    return { success: true };
  } catch (error) { return { error: error.message }; }
}

export async function deleteRegistration(registrationId) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized - Only Super Admin can delete registrations" };
    }

    // Get registration to collect file URLs
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return { error: "Registration not found" };
    }

    // Collect all file URLs from registration
    const filesToDelete = [];
    
    // Add payment screenshot
    if (registration.paymentSs) {
      filesToDelete.push(registration.paymentSs);
    }
    
    // Add any uploaded files from userData (form fields)
    if (registration.userData && typeof registration.userData === 'object') {
      Object.values(registration.userData).forEach(value => {
        if (typeof value === 'string' && value.startsWith('/') && value.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i)) {
          filesToDelete.push(value);
        }
      });
    }

    // Delete from database
    await prisma.registration.delete({
      where: { id: registrationId },
    });

    // Delete files from storage
    if (filesToDelete.length > 0) {
      await deleteMultipleFilesFromStorage(filesToDelete);
    }

    return { success: true };
  } catch (error) {
    console.error("Delete registration error:", error);
    return { error: "Failed to delete registration. Please try again." };
  }
}
