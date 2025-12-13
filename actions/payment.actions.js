"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFileFromStorage, deleteMultipleFilesFromStorage } from "@/lib/storage";

export async function submitPaymentProof(data) {
  try {
    const session = await auth();

    if (!session) {
      return { error: "Unauthorized" };
    }

    const { registrationId, transactionId, screenshotUrl } = data;

    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      return { error: "Registration not found" };
    }

    if (registration.paymentStatus === "paid") {
      return { error: "Payment already verified" };
    }

    await prisma.registration.update({
      where: { id: registrationId },
      data: {
        transactionId,
        paymentSs: screenshotUrl,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Payment proof error:", error);
    return { error: "Failed to submit payment proof. Please try again." };
  }
}

export async function updatePaymentStatus(registrationId, status) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
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

    // Check ownership for organizers
    if (
      session.user.role === "ORGANIZER" &&
      registration.event.tournament?.organizerId !== session.user.id
    ) {
      return { error: "You don't have permission to update this registration" };
    }

    await prisma.registration.update({
      where: { id: registrationId },
      data: { paymentStatus: status },
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
