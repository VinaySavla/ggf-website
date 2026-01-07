"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Keep createOrganizer as alias for backward compatibility
export async function createOrganizer(data) {
  return createUser({ ...data, role: "ORGANIZER" });
}

export async function createUser(data) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    const { firstName, middleName, surname, email, mobile, password, role = "USER" } = data;

    // Validate role
    const validRoles = ["USER", "ORGANIZER", "SUPER_ADMIN"];
    if (!validRoles.includes(role)) {
      return { error: "Invalid role" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(mobile ? [{ mobile }] : []),
        ],
      },
    });

    if (existingUser) {
      return { error: "An account with this email or mobile already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        firstName,
        middleName,
        surname,
        email,
        mobile: mobile || null,
        password: hashedPassword,
        role,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Failed to create user. Please try again." };
  }
}

export async function getOrganizers() {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    const organizers = await prisma.user.findMany({
      where: { role: "ORGANIZER" },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        createdAt: true,
        _count: {
          select: { createdEvents: true },
        },
      },
    });

    return { organizers };
  } catch (error) {
    console.error("Get organizers error:", error);
    return { error: "Failed to fetch organizers." };
  }
}

export async function updateOrganizer(id, data) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    const updateData = {
      name: data.name,
      email: data.email,
      mobile: data.mobile || null,
    };

    // If password is being changed
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return { success: true };
  } catch (error) {
    console.error("Update organizer error:", error);
    return { error: "Failed to update organizer. Please try again." };
  }
}

export async function deleteOrganizer(id) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    await prisma.user.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete organizer error:", error);
    return { error: "Failed to delete organizer. Please try again." };
  }
}

export async function toggleUserStatus(id, isActive) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    // Don't allow deactivating super admins
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.role === "SUPER_ADMIN") {
      return { error: "Cannot modify Super Admin status" };
    }

    await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    return { success: true };
  } catch (error) {
    console.error("Toggle user status error:", error);
    return { error: "Failed to update user status. Please try again." };
  }
}

export async function deletePlayer(id) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    // Get the player to find the user ID
    const player = await prisma.masterPlayer.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!player) {
      return { error: "Player not found" };
    }

    // Delete the user (cascades to player profile)
    await prisma.user.delete({
      where: { id: player.userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete player error:", error);
    return { error: "Failed to delete player. Please try again." };
  }
}
