"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { sendEventRegistrationEmail } from "@/lib/mail";
import { deleteFileFromStorage, deleteMultipleFilesFromStorage } from "@/lib/storage";
import crypto from "crypto";
import { normalizeManualPayment } from "@/lib/payment-provider";
import { createNotification } from "@/lib/notifications";
import { positiveInteger } from "@/lib/validation";
import { sanitizeRichText } from "@/lib/sanitize";

const EVENT_TYPES = new Set(["Seminar", "Competition", "Tournament"]);
const FIELD_TYPES = new Set(["text", "textarea", "email", "tel", "number", "select", "radio", "checkbox", "file", "date", "time", "url", "note", "image"]);

function validateEventInput(data) {
  if (!data.title?.trim() || data.title.trim().length > 160) throw new Error("Event title is required and must be under 160 characters");
  if (!EVENT_TYPES.has(data.type)) throw new Error("Invalid event type");
  if (data.type === "Tournament" && !["General", "Village Specific"].includes(data.tournamentType)) throw new Error("Select a valid tournament type");
  if (data.type === "Tournament" && (!Array.isArray(data.sportIds) || data.sportIds.length !== 1)) throw new Error("Select one primary sport for a tournament");
  if (!["common", "separate"].includes(data.registrationCountType || "common")) throw new Error("Invalid registration limit type");
  const start = data.registrationStartDate ? new Date(data.registrationStartDate) : null;
  const end = data.registrationEndDate ? new Date(data.registrationEndDate) : null;
  const eventDate = data.eventDate ? new Date(data.eventDate) : null;
  if ([start, end, eventDate].some((date) => date && Number.isNaN(date.getTime()))) throw new Error("Enter valid event and registration dates");
  if (start && end && start >= end) throw new Error("Registration end must be after registration start");
  if (end && eventDate && end > eventDate) throw new Error("Registration must close before the event begins");
  for (const [key, label] of [["maxTotalRegistrations", "Total limit"], ["maxMaleRegistrations", "Male limit"], ["maxFemaleRegistrations", "Female limit"], ["maxOtherRegistrations", "Other limit"], ["paymentReviewHours", "Payment review time"]]) positiveInteger(data[key], label);
  if (data.isPaid && (!Number.isInteger(Number(data.paymentAmount)) || Number(data.paymentAmount) <= 0)) throw new Error("Paid events require a positive payment amount");
  if (data.isPaid && !data.upiQrImage && !data.upiId?.trim()) throw new Error("Paid events require a UPI ID or QR code");
  if (!Array.isArray(data.formSchema)) throw new Error("Invalid registration form");
  const ids = new Set();
  for (const field of data.formSchema) {
    if (!field?.id || ids.has(field.id) || !FIELD_TYPES.has(field.type)) throw new Error("Registration fields must have unique IDs and valid types");
    ids.add(field.id);
  }
}

export async function createEvent(data) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }
    validateEventInput(data);

    const { 
      title, description, eligibility, type, tournamentType, eventDate, venue, village,
      isPaid, upiQrImage, isActive, formSchema, organizerId, sportIds,
      registrationStartDate, registrationEndDate,
      registrationCountType, maxTotalRegistrations, maxMaleRegistrations, maxFemaleRegistrations, maxOtherRegistrations,
      paymentAmount, upiId, paymentInstructions, paymentReviewHours, refundPolicy
    } = data;

    // Generate unique slug
    let slug = generateSlug(title);
    const existingEvent = await prisma.event.findUnique({ where: { slug } });
    if (existingEvent) {
      slug = `${slug}-${Date.now()}`;
    }

    // For tournaments, determine the organizer (optional)
    let finalOrganizerId = organizerId || null;
    if (session.user.role === "ORGANIZER") {
      finalOrganizerId = session.user.id;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description: sanitizeRichText(description),
        eligibility: sanitizeRichText(eligibility),
        slug,
        type,
        tournamentType: type === "Tournament" ? tournamentType : null,
        eventDate: eventDate || null,
        venue,
        village,
        organizerId: finalOrganizerId,
        isPaid,
        upiQrImage: isPaid ? upiQrImage : null,
        paymentAmount: isPaid && paymentAmount ? Number(paymentAmount) : null,
        upiId: isPaid ? (upiId || null) : null,
        paymentInstructions: isPaid ? (paymentInstructions || null) : null,
        paymentReviewHours: Number(paymentReviewHours) || 48,
        refundPolicy: isPaid ? (refundPolicy || null) : null,
        isActive,
        formSchema: formSchema || [],
        registrationStartDate: registrationStartDate || null,
        registrationEndDate: registrationEndDate || null,
        registrationCountType: registrationCountType || "common",
        maxTotalRegistrations: maxTotalRegistrations || null,
        maxMaleRegistrations: maxMaleRegistrations || null,
        maxFemaleRegistrations: maxFemaleRegistrations || null,
        maxOtherRegistrations: maxOtherRegistrations || null,
        ...(type === "Tournament" && {
          tournament: {
            create: {
              organizerId: finalOrganizerId || undefined,
              sportId: sportIds[0],
            },
          },
        }),
        // Add sports if provided
        ...(sportIds && sportIds.length > 0 && {
          sports: {
            create: sportIds.map((sportId) => ({ sportId })),
          },
        }),
      },
    });

    return { success: true, eventId: event.id, slug: event.slug };
  } catch (error) {
    console.error("Create event error:", error);
    return { error: "Failed to create event. Please try again." };
  }
}

export async function updateEvent(id, data) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }
    validateEventInput(data);

    // Check ownership for organizers
    const event = await prisma.event.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    if (session.user.role === "ORGANIZER" && event.organizerId !== session.user.id && event.tournament?.organizerId !== session.user.id) {
      return { error: "You don't have permission to edit this event" };
    }

    const { 
      title, description, eligibility, type, tournamentType, eventDate, venue, village,
      isPaid, upiQrImage, isActive, formSchema, organizerId, sportIds,
      registrationStartDate, registrationEndDate,
      registrationCountType, maxTotalRegistrations, maxMaleRegistrations, maxFemaleRegistrations, maxOtherRegistrations,
      paymentAmount, upiId, paymentInstructions, paymentReviewHours, refundPolicy
    } = data;

    // Generate new slug if title changed
    let slug = event.slug;
    if (title !== event.title) {
      slug = generateSlug(title);
      const existingEvent = await prisma.event.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existingEvent) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    await prisma.$transaction(async (tx) => {
      // Update event
      await tx.event.update({
        where: { id },
        data: {
          title,
          description: sanitizeRichText(description),
          eligibility: sanitizeRichText(eligibility),
          slug,
          type,
          tournamentType: type === "Tournament" ? tournamentType : null,
          eventDate: eventDate || null,
          venue,
          village,
          organizerId: session.user.role === "SUPER_ADMIN" ? (organizerId || null) : session.user.id,
          isPaid,
          upiQrImage: isPaid ? upiQrImage : null,
          paymentAmount: isPaid && paymentAmount ? Number(paymentAmount) : null,
          upiId: isPaid ? (upiId || null) : null,
          paymentInstructions: isPaid ? (paymentInstructions || null) : null,
          paymentReviewHours: Number(paymentReviewHours) || 48,
          refundPolicy: isPaid ? (refundPolicy || null) : null,
          isActive,
          formSchema: formSchema || [],
          registrationStartDate: registrationStartDate || null,
          registrationEndDate: registrationEndDate || null,
          registrationCountType: registrationCountType || "common",
          maxTotalRegistrations: maxTotalRegistrations || null,
          maxMaleRegistrations: maxMaleRegistrations || null,
          maxFemaleRegistrations: maxFemaleRegistrations || null,
          maxOtherRegistrations: maxOtherRegistrations || null,
        },
      });

      // Update sports - delete existing and recreate
      if (sportIds !== undefined) {
        await tx.eventSport.deleteMany({ where: { eventId: id } });
        if (sportIds && sportIds.length > 0) {
          await tx.eventSport.createMany({
            data: sportIds.map((sportId) => ({ eventId: id, sportId })),
          });
        }
      }

      const assignedOrganizerId = session.user.role === "SUPER_ADMIN" ? (organizerId || null) : session.user.id;
      if (type === "Tournament") {
        await tx.tournamentMaster.upsert({
          where: { eventId: id },
          update: { organizerId: assignedOrganizerId, sportId: sportIds[0] },
          create: { eventId: id, organizerId: assignedOrganizerId, sportId: sportIds[0] },
        });
      } else if (event.tournament) {
        await tx.tournamentMaster.delete({ where: { id: event.tournament.id } });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Update event error:", error);
    return { error: "Failed to update event. Please try again." };
  }
}

export async function deleteEvent(id) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    // Get event with all registrations to collect files to delete
    const event = await prisma.event.findUnique({
      where: { id },
      include: { registrations: true },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    // Collect all file URLs
    const filesToDelete = [];
    
    // Add UPI QR image
    if (event.upiQrImage) {
      filesToDelete.push(event.upiQrImage);
    }
    
    // Add files from all registrations
    for (const reg of event.registrations) {
      if (reg.paymentSs) {
        filesToDelete.push(reg.paymentSs);
      }
      // Check userData for uploaded files
      if (reg.userData && typeof reg.userData === 'object') {
        Object.values(reg.userData).forEach(value => {
          if (typeof value === 'string' && value.startsWith('/') && value.match(/\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i)) {
            filesToDelete.push(value);
          }
        });
      }
    }

    // Delete from database
    await prisma.event.delete({
      where: { id },
    });

    // Delete files from storage
    if (filesToDelete.length > 0) {
      await deleteMultipleFilesFromStorage(filesToDelete);
    }

    return { success: true };
  } catch (error) {
    console.error("Delete event error:", error);
    return { error: "Failed to delete event. Please try again." };
  }
}

export async function submitRegistration(data) {
  try {
    const session = await auth();

    if (!session) {
      return { error: "Please login to register for events" };
    }

    const { eventId, userData, transactionId, paymentScreenshot } = data;

    const registration = await prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (!event || !event.isActive) throw new Error("Event not found or no longer active");

      const now = new Date();
      if (event.registrationStartDate && now < event.registrationStartDate) throw new Error("Registration has not started yet");
      if (event.registrationEndDate && now > event.registrationEndDate) throw new Error("Registration window has closed");

      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        include: { userProfile: { select: { playerId: true } } },
      });
      if (!user || !user.isActive) throw new Error("User account is unavailable");
      if (!user.gender || !user.village || !user.photo || !user.email || !user.mobile) {
        throw new Error("Complete all mandatory profile details before registering");
      }

      const existing = await tx.registration.findFirst({
        where: { eventId, OR: [{ userId: user.id }, { userData: { path: ["userId"], equals: user.id } }] },
      });
      if (existing && existing.status !== "cancelled") throw new Error("You have already registered for this event");

      const totalCount = await tx.registration.count({ where: { eventId, status: "active" } });
      if (event.registrationCountType === "common" && event.maxTotalRegistrations && totalCount >= event.maxTotalRegistrations) {
        throw new Error("Registration limit has been reached");
      }
      if (event.registrationCountType === "separate") {
        const genderCount = await tx.registration.count({ where: { eventId, gender: user.gender, status: "active" } });
        const limit = user.gender === "Male" ? event.maxMaleRegistrations : user.gender === "Female" ? event.maxFemaleRegistrations : event.maxOtherRegistrations;
        if (limit && genderCount >= limit) throw new Error(`${user.gender} registration limit has been reached`);
      }

      const payment = event.isPaid ? normalizeManualPayment({ transactionId, screenshotUrl: paymentScreenshot }) : null;
      if (payment && !payment.screenshotUrl.startsWith(`/api/files/payments/${user.id}/`)) throw new Error("Upload payment proof through the secure registration form");
      if (payment) {
        const duplicatePayment = await tx.registration.findFirst({ where: { paymentProvider: "manual", paymentReference: { equals: payment.reference, mode: "insensitive" } }, select: { id: true } });
        if (duplicatePayment) throw new Error("This transaction ID / UTR has already been submitted");
      }
      const registrationNumber = `GGF-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const ticketCode = crypto.randomBytes(24).toString("hex");

      const registrationData = {
          eventId,
          userId: user.id,
          registrationNumber,
          ticketCode,
          gender: user.gender,
          userData: {
            ...userData,
            userId: user.id,
            firstName: user.firstName,
            middleName: user.middleName,
            surname: user.surname,
            email: user.email,
            mobile: user.mobile,
            gender: user.gender,
            village: user.village,
            profileImage: user.photo,
          },
          paymentStatus: payment?.status || "paid",
          transactionId: payment?.reference,
          paymentSs: payment?.screenshotUrl,
          paymentProvider: payment?.provider || "manual",
          paymentReference: payment?.reference,
          paymentMetadata: payment?.metadata,
          status: "active",
          canceledAt: null,
        };
      const created = await tx.registration.create({ data: registrationData });

      await tx.eventWaitlist.updateMany({ where: { eventId, userId: user.id }, data: { status: "joined" } });

      await createNotification({
        userId: user.id,
        type: "registration",
        title: "Registration received",
        message: event.isPaid ? `${event.title}: payment proof is awaiting manual verification.` : `${event.title}: your registration is confirmed.`,
        href: `/my-registrations/${created.id}`,
      }, tx);
      return { ...created, event, user };
    }, { isolationLevel: "Serializable" });

    const fullName = `${registration.user.firstName} ${registration.user.middleName} ${registration.user.surname}`;

    // Send confirmation email (don't wait, don't fail registration if email fails)
    sendEventRegistrationEmail(
      registration.user.email,
      fullName,
      registration.event.title,
      registration.user.userProfile?.playerId || 'N/A',
      registration.event.isPaid
    ).catch(err => {
      console.error('Failed to send registration email:', err);
    });

    return { success: true, registrationId: registration.id, registrationNumber: registration.registrationNumber };
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === "P2002") return { error: "You have already registered for this event" };
    if (error.code === "P2034") return { error: "Registration was busy. Please try once more." };
    return { error: error.message || "Failed to register. Please try again." };
  }
}
