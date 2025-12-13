"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createTeam(data) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }

    const { name, tournamentId, logo, gender } = data;

    // Verify tournament exists and user has access
    const tournament = await prisma.tournamentMaster.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return { error: "Tournament not found" };
    }

    if (session.user.role === "ORGANIZER" && tournament.organizerId !== session.user.id) {
      return { error: "You don't have permission to add teams to this tournament" };
    }

    await prisma.team.create({
      data: {
        name,
        tournamentId,
        logo: logo || null,
        gender: gender || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Create team error:", error);
    return { error: "Failed to create team. Please try again." };
  }
}

export async function updateTeam(id, data) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!team) {
      return { error: "Team not found" };
    }

    if (session.user.role === "ORGANIZER" && team.tournament.organizerId !== session.user.id) {
      return { error: "You don't have permission to edit this team" };
    }

    const { name, logo, gender } = data;

    await prisma.team.update({
      where: { id },
      data: {
        name,
        logo: logo || null,
        gender: gender || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Update team error:", error);
    return { error: "Failed to update team. Please try again." };
  }
}

export async function deleteTeam(id) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { tournament: true },
    });

    if (!team) {
      return { error: "Team not found" };
    }

    if (session.user.role === "ORGANIZER" && team.tournament.organizerId !== session.user.id) {
      return { error: "You don't have permission to delete this team" };
    }

    await prisma.team.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    console.error("Delete team error:", error);
    return { error: "Failed to delete team. Please try again." };
  }
}

export async function addPlayerToTeam(data) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }

    const { playerId, teamId, tournamentId, auctionPrice, role } = data;

    // Verify access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { tournament: true },
    });

    if (!team) {
      return { error: "Team not found" };
    }

    if (session.user.role === "ORGANIZER" && team.tournament.organizerId !== session.user.id) {
      return { error: "You don't have permission to manage this team's roster" };
    }

    // Check if player exists
    const player = await prisma.masterPlayer.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return { error: "Player not found" };
    }

    // Check if player is already in this tournament
    const existingRoster = await prisma.tournamentRoster.findUnique({
      where: {
        playerId_tournamentId: {
          playerId,
          tournamentId: team.tournamentId,
        },
      },
    });

    if (existingRoster) {
      return { error: "Player is already in a team for this tournament" };
    }

    await prisma.tournamentRoster.create({
      data: {
        playerId,
        teamId,
        tournamentId: team.tournamentId,
        auctionPrice: auctionPrice || 0,
        role: role || null,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Add player to team error:", error);
    return { error: "Failed to add player to team. Please try again." };
  }
}

export async function removePlayerFromTeam(rosterId) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
      return { error: "Unauthorized" };
    }

    const roster = await prisma.tournamentRoster.findUnique({
      where: { id: rosterId },
      include: {
        team: {
          include: { tournament: true },
        },
      },
    });

    if (!roster) {
      return { error: "Roster entry not found" };
    }

    if (session.user.role === "ORGANIZER" && roster.team.tournament.organizerId !== session.user.id) {
      return { error: "You don't have permission to manage this team's roster" };
    }

    await prisma.tournamentRoster.delete({
      where: { id: rosterId },
    });

    return { success: true };
  } catch (error) {
    console.error("Remove player from team error:", error);
    return { error: "Failed to remove player from team. Please try again." };
  }
}
