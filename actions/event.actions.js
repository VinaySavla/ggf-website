"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";
import { sendEventRegistrationEmail } from "@/lib/mail";
import { deleteFileFromStorage, deleteMultipleFilesFromStorage } from "@/lib/storage";

export async function createEvent(data) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }

    const { 
      title, description, eligibility, type, tournamentType, eventDate, venue, 
      isPaid, upiQrImage, isActive, formSchema, organizerId, sportIds,
      registrationStartDate, registrationEndDate,
      registrationCountType, maxTotalRegistrations, maxMaleRegistrations, maxFemaleRegistrations
    } = data;

    // Generate unique slug
    let slug = generateSlug(title);
    const existingEvent = await prisma.event.findUnique({ where: { slug } });
    if (existingEvent) {
      slug = `${slug}-${Date.now()}`;
    }

    // For tournaments, determine the organizer (optional)
    let finalOrganizerId = organizerId || null;
    if (type === "Tournament" && session.user.role === "ORGANIZER") {
      finalOrganizerId = session.user.id;
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eligibility,
        slug,
        type,
        tournamentType: type === "Tournament" ? tournamentType : null,
        eventDate: eventDate || null,
        venue,
        village,
        isPaid,
        upiQrImage: isPaid ? upiQrImage : null,
        isActive,
        formSchema: formSchema || [],
        registrationStartDate: registrationStartDate || null,
        registrationEndDate: registrationEndDate || null,
        registrationCountType: registrationCountType || "common",
        maxTotalRegistrations: maxTotalRegistrations || null,
        maxMaleRegistrations: maxMaleRegistrations || null,
        maxFemaleRegistrations: maxFemaleRegistrations || null,
        ...(type === "Tournament" && {
          tournament: {
            create: {
              organizerId: finalOrganizerId || undefined,
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

    // Check ownership for organizers
    const event = await prisma.event.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!event) {
      return { error: "Event not found" };
    }

    if (session.user.role === "ORGANIZER" && event.tournament?.organizerId !== session.user.id) {
      return { error: "You don't have permission to edit this event" };
    }

    const { 
      title, description, eligibility, type, tournamentType, eventDate, venue, 
      isPaid, upiQrImage, isActive, formSchema, organizerId, sportIds,
      registrationStartDate, registrationEndDate,
      registrationCountType, maxTotalRegistrations, maxMaleRegistrations, maxFemaleRegistrations
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
          description,
          eligibility,
          slug,
          type,
          tournamentType: type === "Tournament" ? tournamentType : null,
          eventDate: eventDate || null,
          venue,
          village,
          isPaid,
          upiQrImage: isPaid ? upiQrImage : null,
          isActive,
          formSchema: formSchema || [],
          registrationStartDate: registrationStartDate || null,
          registrationEndDate: registrationEndDate || null,
          registrationCountType: registrationCountType || "common",
          maxTotalRegistrations: maxTotalRegistrations || null,
          maxMaleRegistrations: maxMaleRegistrations || null,
          maxFemaleRegistrations: maxFemaleRegistrations || null,
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

      // Update organizer if super admin and tournament (organizerId can be null to unassign)
      if (session.user.role === "SUPER_ADMIN" && type === "Tournament" && event.tournament) {
        await tx.tournamentMaster.update({
          where: { id: event.tournament.id },
          data: { organizerId: organizerId || null },
        });
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

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        registrations: {
          select: { gender: true }
        }
      }
    });

    if (!event || !event.isActive) {
      return { error: "Event not found or no longer active" };
    }

    // Check registration window
    const now = new Date();
    if (event.registrationStartDate && now < new Date(event.registrationStartDate)) {
      return { error: "Registration has not started yet" };
    }
    if (event.registrationEndDate && now > new Date(event.registrationEndDate)) {
      return { error: "Registration window has closed" };
    }

    // Get full user data including mobile and gender
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, mobile: true, gender: true },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Get gender from user profile
    const userGender = user.gender;
    if (!userGender) {
      return { error: "Please update your profile with your gender before registering" };
    }

    // Check registration limits
    if (event.registrationCountType === "common" && event.maxTotalRegistrations) {
      if (event.registrations.length >= event.maxTotalRegistrations) {
        return { error: "Registration limit has been reached" };
      }
    } else if (event.registrationCountType === "separate") {
      const maleCount = event.registrations.filter(r => r.gender === "Male").length;
      const femaleCount = event.registrations.filter(r => r.gender === "Female").length;

      if (userGender === "Male" && event.maxMaleRegistrations && maleCount >= event.maxMaleRegistrations) {
        return { error: "Male registration limit has been reached" };
      }
      if (userGender === "Female" && event.maxFemaleRegistrations && femaleCount >= event.maxFemaleRegistrations) {
        return { error: "Female registration limit has been reached" };
      }
    }

    // For paid events, require payment proof
    if (event.isPaid) {
      if (!transactionId || !transactionId.trim()) {
        return { error: "Transaction ID is required for paid events" };
      }
      if (!paymentScreenshot) {
        return { error: "Payment screenshot is required for paid events" };
      }
    }

    // Check if already registered (by userId or email)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId,
        OR: [
          { userData: { path: ["userId"], equals: user.id } },
          { userData: { path: ["email"], equals: user.email } },
        ],
      },
    });

    if (existingRegistration) {
      return { error: "You have already registered for this event" };
    }

    // Get member ID for the email
    const userProfile = await prisma.masterPlayer.findUnique({
      where: { userId: user.id },
      select: { playerId: true },
    });

    // Create registration with mandatory fields from user profile
    const registration = await prisma.registration.create({
      data: {
        eventId,
        gender: userGender,
        userData: {
          ...userData,
          userId: user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile || userData.mobile,
          gender: userGender,
        },
        paymentStatus: event.isPaid ? "pending" : "paid",
        // Include payment info for paid events
        ...(event.isPaid && {
          transactionId: transactionId,
          paymentSs: paymentScreenshot,
        }),
      },
    });

    // Send confirmation email (don't wait, don't fail registration if email fails)
    sendEventRegistrationEmail(
      user.email,
      user.name,
      event.title,
      userProfile?.playerId || 'N/A',
      event.isPaid
    ).catch(err => {
      console.error('Failed to send registration email:', err);
    });

    return { success: true, registrationId: registration.id };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to register. Please try again." };
  }
}
