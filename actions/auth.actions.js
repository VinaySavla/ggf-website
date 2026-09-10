"use server";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendLoginCodeEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/mail";
import { checkRateLimit } from "@/lib/rate-limit";
import { authSecret } from "@/lib/secrets";

// Generate unique Member ID
async function generateMemberId() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const timeKey = `${year}${month}${day}${hour}${minute}`;

  // Atomically get and increment the sequence
  const sequence = await prisma.playerIdSequence.upsert({
    where: { yearMonth: timeKey },
    update: { lastIndex: { increment: 1 } },
    create: { yearMonth: timeKey, lastIndex: 1 },
  });

  const index = sequence.lastIndex.toString().padStart(4, "0");
  return `${timeKey}${index}`;
}

export async function registerUser(data) {
  try {
    const normalizedEmail = String(data.email || "").trim().toLowerCase();
    const normalizedMobile = String(data.mobile || "").trim();
    await checkRateLimit("registration", normalizedEmail || normalizedMobile, 4, 60 * 60 * 1000);
    const { firstName, middleName, surname, email, mobile, village, password, photo, gender } = data;

    if (![firstName, middleName, surname, email, mobile, village, password, photo, gender].every(value => String(value || "").trim())) {
      return { error: "All registration fields, including profile photo, are required" };
    }
    
    // Validate mobile number (10 digits)
    if (!/^\d{10}$/.test(normalizedMobile)) {
      return { error: "Mobile number must be exactly 10 digits" };
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return { error: "Password must be at least 8 characters and include a letter and number" };
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: { equals: normalizedEmail, mode: "insensitive" } }, { mobile: normalizedMobile }],
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
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          surname: surname.trim(),
          email: normalizedEmail,
          mobile: normalizedMobile,
          village,
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
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          surname: surname.trim(),
          photo, // Also save to MasterPlayer for backwards compatibility
        },
      });
    });

    // Construct full name for email
    const fullName = `${firstName} ${middleName} ${surname}`;

    // Send welcome email (don't wait for it, don't fail registration if email fails)
    sendWelcomeEmail(normalizedEmail, fullName, memberId).catch(err => {
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
    const normalizedEmail = String(email || "").trim().toLowerCase();
    await checkRateLimit("password-reset", normalizedEmail, 4, 60 * 60 * 1000);
    const user = await prisma.user.findFirst({ where: { email: { equals: normalizedEmail, mode: "insensitive" } } });

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
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: tokenHash,
        expires,
        userId: user.id,
      },
    });

    // Send email
    const mailResult = await sendPasswordResetEmail(normalizedEmail, token);
    if (!mailResult.success) return { error: "Email service is temporarily unavailable. Please try again later." };

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to send reset link. Please try again." };
  }
}

export async function requestLoginCode(identifier) {
  try {
    const raw = String(identifier || "").trim();
    const normalized = raw.includes("@") ? raw.toLowerCase() : raw;
    if (!normalized) return { error: "Enter your email, mobile or member ID" };
    await checkRateLimit("login-code-request", normalized, 4, 15 * 60 * 1000);
    let user = await prisma.user.findFirst({ where: { OR: [{ email: { equals: normalized, mode: "insensitive" } }, { mobile: normalized }] } });
    if (!user) {
      const profile = await prisma.masterPlayer.findUnique({ where: { playerId: normalized }, include: { user: true } });
      user = profile?.user || null;
    }
    if (!user?.email || !user.isActive) return { success: true };
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHmac("sha256", authSecret()).update(code).digest("hex");
    await prisma.$transaction([
      prisma.loginCode.deleteMany({ where: { userId: user.id } }),
      prisma.loginCode.create({ data: { userId: user.id, codeHash, expiresAt: new Date(Date.now() + 10 * 60 * 1000) } }),
    ]);
    const result = await sendLoginCodeEmail(user.email, user.firstName, code);
    if (!result.success) return { error: "Email service is temporarily unavailable" };
    return { success: true };
  } catch (error) {
    console.error("Login code error:", error);
    return { error: "Unable to send a sign-in code. Please try again." };
  }
}

export async function verifyResetToken(token) {
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
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
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return { error: "Password must be at least 8 characters and include a letter and number" };
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: tokenHash },
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
