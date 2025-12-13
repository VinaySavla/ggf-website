"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/mail";

// Generate unique Member ID
async function generateMemberId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const yearMonth = `${year}-${month}`;

  // Atomically get and increment the sequence
  const sequence = await prisma.playerIdSequence.upsert({
    where: { yearMonth },
    update: { lastIndex: { increment: 1 } },
    create: { yearMonth, lastIndex: 1 },
  });

  const index = sequence.lastIndex.toString().padStart(5, "0");
  return `GGF-GSC-${yearMonth}-${index}`;
}

export async function registerUser(data) {
  try {
    const { name, email, mobile, password, photo, gender } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    });

    if (existingUser) {
      return { error: "An account with this email or mobile already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate Member ID
    const memberId = await generateMemberId();

    // Create user and user profile in a transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          mobile,
          password: hashedPassword,
          photo,
          gender,
          role: "USER",
        },
      });

      await tx.masterPlayer.create({
        data: {
          playerId: memberId,
          userId: user.id,
          photo, // Also save to MasterPlayer for backwards compatibility
        },
      });
    });

    // Send welcome email (don't wait for it, don't fail registration if email fails)
    sendWelcomeEmail(email, name, memberId).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    return { success: true, memberId };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Failed to register. Please try again." };
  }
}

export async function sendPasswordResetLink(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { success: true };
    }

    // Delete any existing reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        expires,
        userId: user.id,
      },
    });

    // Send email
    await sendPasswordResetEmail(email, token);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to send reset link. Please try again." };
  }
}

export async function verifyResetToken(token) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { valid: false };
    }

    if (new Date() > resetToken.expires) {
      // Token expired, delete it
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return { valid: false };
    }

    return { valid: true };
  } catch (error) {
    console.error("Token verification error:", error);
    return { valid: false };
  }
}

export async function resetPassword(token, newPassword) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || new Date() > resetToken.expires) {
      return { error: "Invalid or expired reset link" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to reset password. Please try again." };
  }
}
