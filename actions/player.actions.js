"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/lib/mail";

// Generate Player ID like "GGF-GSC-YYMM-XXXX"
async function generatePlayerId() {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const yearMonth = `${year}-${month}`;

  // Get or create sequence for this month
  const sequence = await prisma.playerIdSequence.upsert({
    where: { yearMonth },
    update: { lastIndex: { increment: 1 } },
    create: { yearMonth, lastIndex: 1 },
  });

  const index = sequence.lastIndex.toString().padStart(4, "0");
  return `GGF-GSC-${yearMonth}-${index}`;
}

// Get all players
export async function getPlayers() {
  try {
    const players = await prisma.masterPlayer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, mobile: true },
        },
        _count: {
          select: {
            tournamentRosters: true,
            statsRecords: true,
          },
        },
      },
    });
    return { players };
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return { error: "Failed to fetch players" };
  }
}

// Create a new player (admin only)
export async function createPlayer(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { name, email, mobile, bio, userId } = data;

    // If linking to existing user, check if they already have a player profile
    if (userId) {
      const existingPlayer = await prisma.masterPlayer.findUnique({
        where: { userId },
      });
      if (existingPlayer) {
        return { error: "This user already has a player profile" };
      }
    }

    // Check if email already exists (if provided and not linking to user)
    if (email && !userId) {
      const existingByEmail = await prisma.masterPlayer.findFirst({
        where: { email },
      });
      if (existingByEmail) {
        return { error: "A player with this email already exists" };
      }
    }

    const playerId = await generatePlayerId();

    const player = await prisma.masterPlayer.create({
      data: {
        playerId,
        name: name || null,
        email: email || null,
        mobile: mobile || null,
        bio: bio || null,
        userId: userId || null,
      },
    });

    revalidatePath("/admin/players");
    return { player };
  } catch (error) {
    console.error("Failed to create player:", error);
    return { error: "Failed to create player" };
  }
}

// Update player
export async function updatePlayer(id, data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { name, email, mobile, bio } = data;

    const player = await prisma.masterPlayer.update({
      where: { id },
      data: {
        name,
        email,
        mobile,
        bio,
      },
    });

    revalidatePath("/admin/players");
    revalidatePath(`/admin/players/${player.playerId}`);
    return { player };
  } catch (error) {
    console.error("Failed to update player:", error);
    return { error: "Failed to update player" };
  }
}

// Delete player
export async function deletePlayer(id) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    await prisma.masterPlayer.delete({
      where: { id },
    });

    revalidatePath("/admin/players");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete player:", error);
    return { error: "Failed to delete player" };
  }
}

// Get users without player profiles (for linking)
export async function getUsersWithoutPlayers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        playerProfile: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
      },
      orderBy: { name: "asc" },
    });
    return { users };
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return { error: "Failed to fetch users" };
  }
}

// Link player to existing user
export async function linkPlayerToUser(playerId, userId) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    // Check if user already has a player profile
    const existingPlayer = await prisma.masterPlayer.findUnique({
      where: { userId },
    });
    if (existingPlayer) {
      return { error: "This user already has a player profile" };
    }

    const player = await prisma.masterPlayer.update({
      where: { id: playerId },
      data: { userId },
    });

    revalidatePath("/admin/players");
    return { player };
  } catch (error) {
    console.error("Failed to link player to user:", error);
    return { error: "Failed to link player to user" };
  }
}

// Create player with full user account (admin only)
export async function createPlayerWithAccount(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { name, email, mobile, password, photo, bio } = data;

    // Validate required fields
    if (!name || !email || !mobile || !password || !photo) {
      return { error: "All fields are required (name, email, mobile, password, photo)" };
    }

    // Check if email or mobile already exists
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

    // Generate Player ID
    const playerId = await generatePlayerId();

    // Create user and player in transaction
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          mobile,
          password: hashedPassword,
          photo,
          role: "PLAYER",
        },
      });

      await tx.masterPlayer.create({
        data: {
          playerId,
          userId: user.id,
          photo,
          bio: bio || null,
        },
      });
    });

    // Send welcome email
    sendWelcomeEmail(email, name, playerId).catch(err => {
      console.error('Failed to send welcome email:', err);
    });

    revalidatePath("/admin/players");
    return { success: true, playerId };
  } catch (error) {
    console.error("Failed to create player with account:", error);
    return { error: "Failed to create player account" };
  }
}
