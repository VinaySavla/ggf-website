import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy, UserPlus } from "lucide-react";
import RosterManager from "@/components/admin/RosterManager";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    select: { name: true },
  });
  
  return {
    title: team ? `${team.name} Roster - GGF Admin` : "Team Roster - GGF Admin",
  };
}

async function getTeamWithRoster(id, userId, role) {
  const isAdmin = role === "SUPER_ADMIN";
  
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      tournament: {
        include: {
          event: { select: { title: true } },
        },
      },
      rosters: {
        include: {
          player: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!team) return null;
  
  // Check permission for organizers
  if (!isAdmin && team.tournament.organizerId !== userId) {
    return null;
  }

  return team;
}

async function getAvailablePlayers(tournamentId) {
  // Get all players that are NOT already assigned to a team in this tournament
  const assignedPlayerIds = await prisma.tournamentRoster.findMany({
    where: { tournamentId },
    select: { playerId: true },
  });

  const assignedIds = assignedPlayerIds.map((r) => r.playerId);

  // Build where clause - only exclude if there are assigned players
  const whereClause = assignedIds.length > 0 
    ? { id: { notIn: assignedIds } }
    : {};

  return prisma.masterPlayer.findMany({
    where: whereClause,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function TeamRosterPage({ params }) {
  const session = await auth();
  
  if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/admin");
  }

  const { id } = await params;
  const team = await getTeamWithRoster(id, session.user.id, session.user.role);

  if (!team) {
    notFound();
  }

  const availablePlayers = await getAvailablePlayers(team.tournamentId);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/teams"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Teams
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary"
              >
                {team.logo ? (
                  <img src={team.logo} alt={team.name} className="w-8 h-8 object-contain" />
                ) : (
                  <Trophy className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                <p className="text-gray-600">{team.tournament.event.title}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="w-5 h-5" />
            <span className="font-medium">{team.rosters.length} Players</span>
          </div>
        </div>
      </div>

      <RosterManager 
        team={team} 
        availablePlayers={availablePlayers}
        userRole={session.user.role}
      />
    </div>
  );
}
