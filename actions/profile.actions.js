"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  try {
    const session = await auth();
    if (!session) {
      return { error: "Not authenticated" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        surname: true,
        email: true,
        mobile: true,
        photo: true,
        role: true,
        gender: true,
        village: true,
        createdAt: true,
        userProfile: {
          select: {
            id: true,
            playerId: true,
            bio: true,
          },
        },
      },
    });

    if (!user) {
      return { error: "User not found" };
    }

    return { user };
  } catch (error) {
    console.error("Get profile error:", error);
    return { error: "Failed to fetch profile" };
  }
}

export async function updateProfile(data) {
  try {
    const session = await auth();
    if (!session) {
      return { error: "Not authenticated" };
    }

    const { firstName, middleName, surname, email, mobile, bio, gender, village } = data;
    
    // Validate single word per name field
    if (firstName && firstName.trim().split(/\s+/).length > 1) {
      return { error: "First name should be a single word only" };
    }
    if (middleName && middleName.trim().split(/\s+/).length > 1) {
      return { error: "Middle name should be a single word only" };
    }
    if (surname && surname.trim().split(/\s+/).length > 1) {
      return { error: "Surname should be a single word only" };
    }

    // Check if email/mobile already used by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: session.user.id } },
          {
            OR: [
              email ? { email } : {},
              mobile ? { mobile } : {},
            ].filter(obj => Object.keys(obj).length > 0),
          },
        ],
      },
    });

    if (existingUser) {
      return { error: "Email or mobile already in use by another account" };
    }

    // Update user and player profile in transaction
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          firstName: firstName?.trim(),
          middleName: middleName?.trim(),
          surname: surname?.trim(),
          email,
          mobile,
          gender,
          village,
        },
      });

      // Update player profile with name and bio if exists
      await tx.masterPlayer.updateMany({
        where: { userId: session.user.id },
        data: { 
          firstName: firstName?.trim(),
          middleName: middleName?.trim(),
          surname: surname?.trim(),
          ...(bio !== undefined && { bio })
        },
      });
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(data) {
  try {
    const session = await auth();
    if (!session) {
      return { error: "Not authenticated" };
    }

    const { currentPassword, newPassword } = data;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return { error: "Current password is incorrect" };
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { error: "Failed to change password" };
  }
}
