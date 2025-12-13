"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// ==================== SPORTS ====================

export async function getSports() {
  try {
    const sports = await prisma.sport.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { statsRecords: true },
        },
      },
    });
    return { sports };
  } catch (error) {
    console.error("Failed to fetch sports:", error);
    return { error: "Failed to fetch sports" };
  }
}

export async function createSport(data) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    const { name, description } = data;

    // Check if sport already exists
    const existing = await prisma.sport.findUnique({
      where: { name },
    });

    if (existing) {
      return { error: "A sport with this name already exists" };
    }

    const sport = await prisma.sport.create({
      data: { name, description },
    });

    revalidatePath("/admin/sports");
    return { sport };
  } catch (error) {
    console.error("Failed to create sport:", error);
    return { error: "Failed to create sport" };
  }
}

export async function updateSport(id, data) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    const { name, description } = data;

    const sport = await prisma.sport.update({
      where: { id },
      data: { name, description },
    });

    revalidatePath("/admin/sports");
    return { sport };
  } catch (error) {
    console.error("Failed to update sport:", error);
    return { error: "Failed to update sport" };
  }
}

export async function deleteSport(id) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    // Check if sport has any stats records
    const statsCount = await prisma.playerStatsRecord.count({
      where: { sportId: id },
    });

    if (statsCount > 0) {
      return { error: `Cannot delete sport with ${statsCount} stats records. Delete the records first.` };
    }

    await prisma.sport.delete({
      where: { id },
    });

    revalidatePath("/admin/sports");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete sport:", error);
    return { error: "Failed to delete sport" };
  }
}

// ==================== PLAYER STATS ====================

export async function getPlayerStats(playerId) {
  try {
    const stats = await prisma.playerStatsRecord.findMany({
      where: { playerId },
      include: {
        sport: true,
        tournament: {
          include: {
            event: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { stats };
  } catch (error) {
    console.error("Failed to fetch player stats:", error);
    return { error: "Failed to fetch player stats" };
  }
}

export async function createPlayerStats(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { playerId, tournamentId, sportId, statsJson, label } = data;

    // Check if stats already exist for this player (either for tournament or general)
    const whereClause = {
      playerId,
      sportId,
    };
    
    if (tournamentId) {
      whereClause.tournamentId = tournamentId;
    } else {
      whereClause.tournamentId = null;
      if (label) {
        whereClause.label = label;
      }
    }

    const existing = await prisma.playerStatsRecord.findFirst({
      where: whereClause,
    });

    if (existing) {
      return { error: "Stats already exist for this player. Please edit instead." };
    }

    const stats = await prisma.playerStatsRecord.create({
      data: {
        playerId,
        tournamentId: tournamentId || null,
        sportId,
        statsJson,
        label: label || null,
      },
    });

    revalidatePath("/admin/stats");
    revalidatePath(`/admin/user/${playerId}`);
    return { stats };
  } catch (error) {
    console.error("Failed to create player stats:", error);
    return { error: "Failed to create player stats" };
  }
}

export async function updatePlayerStats(id, data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { statsJson } = data;

    const stats = await prisma.playerStatsRecord.update({
      where: { id },
      data: { statsJson },
    });

    revalidatePath("/admin/stats");
    return { stats };
  } catch (error) {
    console.error("Failed to update player stats:", error);
    return { error: "Failed to update player stats" };
  }
}

export async function deletePlayerStats(id) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    await prisma.playerStatsRecord.delete({
      where: { id },
    });

    revalidatePath("/admin/stats");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete player stats:", error);
    return { error: "Failed to delete player stats" };
  }
}

// ==================== ALL PLAYERS (for general stats) ====================

export async function getAllPlayers() {
  try {
    const players = await prisma.masterPlayer.findMany({
      include: {
        user: {
          select: { name: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      players: players.map((p) => ({
        id: p.id,
        playerId: p.playerId,
        name: p.user?.name || p.name || "Unknown",
        team: null,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch all players:", error);
    return { error: "Failed to fetch players" };
  }
}

// Get general stats (not linked to any tournament)
export async function getGeneralStats() {
  try {
    const stats = await prisma.playerStatsRecord.findMany({
      where: {
        tournamentId: { equals: null },
      },
      include: {
        sport: true,
        player: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { stats };
  } catch (error) {
    console.error("Failed to fetch general stats:", error);
    return { error: "Failed to fetch general stats" };
  }
}

// ==================== BULK STATS ====================

export async function getTournamentPlayers(tournamentId) {
  try {
    // Get tournament with rosters and registrations
    const tournament = await prisma.tournamentMaster.findUnique({
      where: { id: tournamentId },
      include: {
        event: true,
        rosters: {
          include: {
            player: {
              include: {
                user: {
                  select: { name: true },
                },
              },
            },
            team: true,
          },
        },
      },
    });

    if (!tournament) {
      return { error: "Tournament not found" };
    }

    // Get players from rosters
    const rosterPlayers = tournament.rosters.map((r) => ({
      id: r.player.id,
      playerId: r.player.playerId,
      name: r.player.user?.name || r.player.name || "Unknown",
      team: r.team?.name,
    }));

    // Also get players from registrations
    const registrations = await prisma.registration.findMany({
      where: {
        eventId: tournament.eventId,
        paymentStatus: "paid",
      },
    });

    // Get unique userIds from registrations
    const userIds = registrations
      .map((r) => r.userData?.userId)
      .filter(Boolean);

    // Get player profiles for registered users
    const registeredPlayers = await prisma.masterPlayer.findMany({
      where: {
        userId: { in: userIds },
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    const regPlayers = registeredPlayers.map((p) => ({
      id: p.id,
      playerId: p.playerId,
      name: p.user?.name || p.name || "Unknown",
      team: null,
    }));

    // Combine and deduplicate
    const allPlayers = [...rosterPlayers];
    regPlayers.forEach((rp) => {
      if (!allPlayers.find((p) => p.id === rp.id)) {
        allPlayers.push(rp);
      }
    });

    return { players: allPlayers, tournament };
  } catch (error) {
    console.error("Failed to fetch tournament players:", error);
    return { error: "Failed to fetch tournament players" };
  }
}

export async function bulkCreateStats(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { tournamentId, sportId, playerStats, label } = data;

    // playerStats is an array of { playerId, statsJson }
    const createPromises = playerStats.map(async (ps) => {
      // Check if already exists
      const whereClause = {
        playerId: ps.playerId,
        sportId,
      };
      
      if (tournamentId) {
        whereClause.tournamentId = tournamentId;
      } else {
        whereClause.tournamentId = null;
        if (label) {
          whereClause.label = label;
        }
      }

      const existing = await prisma.playerStatsRecord.findFirst({
        where: whereClause,
      });

      if (existing) {
        // Update instead
        return prisma.playerStatsRecord.update({
          where: { id: existing.id },
          data: { statsJson: ps.statsJson },
        });
      }

      return prisma.playerStatsRecord.create({
        data: {
          playerId: ps.playerId,
          tournamentId: tournamentId || null,
          sportId,
          statsJson: ps.statsJson,
          label: label || null,
        },
      });
    });

    await Promise.all(createPromises);

    revalidatePath("/admin/stats");
    return { success: true, count: playerStats.length };
  } catch (error) {
    console.error("Failed to bulk create stats:", error);
    return { error: "Failed to save stats" };
  }
}

// ==================== TOURNAMENTS LIST ====================

export async function getTournaments() {
  try {
    const tournaments = await prisma.tournamentMaster.findMany({
      include: {
        event: {
          select: {
            title: true,
            eventDate: true,
          },
        },
        _count: {
          select: {
            rosters: true,
            statsRecords: true,
          },
        },
      },
      orderBy: {
        event: {
          eventDate: "desc",
        },
      },
    });
    return { tournaments };
  } catch (error) {
    console.error("Failed to fetch tournaments:", error);
    return { error: "Failed to fetch tournaments" };
  }
}
