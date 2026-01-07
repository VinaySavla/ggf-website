import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Trophy } from "lucide-react";
import StatsEntryForm from "@/components/admin/StatsEntryForm";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { tournamentId } = await params;
  const tournament = await prisma.tournamentMaster.findUnique({
    where: { id: tournamentId },
    include: { event: { select: { title: true } } },
  });
  
  return {
    title: tournament ? `Stats - ${tournament.event.title}` : "Tournament Stats",
  };
}

async function getTournamentData(tournamentId) {
  const tournament = await prisma.tournamentMaster.findUnique({
    where: { id: tournamentId },
    include: {
      event: true,
      rosters: {
        include: {
          player: {
            include: {
              user: { select: { firstName: true, middleName: true, surname: true } },
            },
          },
          team: true,
        },
      },
      statsRecords: {
        include: {
          player: {
            include: {
              user: { select: { firstName: true, middleName: true, surname: true } },
            },
          },
          sport: true,
        },
      },
    },
  });

  if (!tournament) return null;

  // Also get players from registrations
  const registrations = await prisma.registration.findMany({
    where: {
      eventId: tournament.eventId,
      paymentStatus: "paid",
    },
  });

  const userIds = registrations.map((r) => r.userData?.userId).filter(Boolean);

  const registeredPlayers = await prisma.masterPlayer.findMany({
    where: { userId: { in: userIds } },
    include: {
      user: { select: { firstName: true, middleName: true, surname: true } },
    },
  });

  // Get all sports
  const sports = await prisma.sport.findMany({
    orderBy: { name: "asc" },
  });

  return { tournament, registeredPlayers, sports };
}

export default async function TournamentStatsPage({ params }) {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const { tournamentId } = await params;
  const data = await getTournamentData(tournamentId);

  if (!data) {
    notFound();
  }

  const { tournament, registeredPlayers, sports } = data;

  // Combine players from rosters and registrations
  const rosterPlayers = tournament.rosters.map((r) => ({
    id: r.player.id,
    playerId: r.player.playerId,
    name: `${r.player.user.firstName} ${r.player.user.middleName} ${r.player.user.surname}`,
    team: r.team?.name,
    source: "roster",
  }));

  const regPlayers = registeredPlayers.map((p) => ({
    id: p.id,
    playerId: p.playerId,
    name: `${p.user.firstName} ${p.user.middleName} ${p.user.surname}`,
    team: null,
    source: "registration",
  }));

  // Deduplicate
  const allPlayers = [...rosterPlayers];
  regPlayers.forEach((rp) => {
    if (!allPlayers.find((p) => p.id === rp.id)) {
      allPlayers.push(rp);
    }
  });

  // Group existing stats by player
  const existingStats = {};
  tournament.statsRecords.forEach((record) => {
    if (!existingStats[record.playerId]) {
      existingStats[record.playerId] = [];
    }
    existingStats[record.playerId].push(record);
  });

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/admin/stats"
          className="inline-flex items-center text-gray-600 hover:text-primary mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stats
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{tournament.event.title}</h1>
            <p className="text-gray-600">
              {allPlayers.length} players • {tournament.statsRecords.length} stats records
            </p>
          </div>
        </div>
      </div>

      {sports.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-800 mb-2">No Sports Configured</h3>
          <p className="text-yellow-700 text-sm mb-4">
            You need to add sports categories before you can enter player stats.
          </p>
          <Link
            href="/admin/sports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
          >
            <Trophy className="w-4 h-4" />
            Manage Sports
          </Link>
        </div>
      ) : (
        <StatsEntryForm
          tournamentId={tournamentId}
          players={allPlayers}
          sports={sports}
          existingStats={existingStats}
        />
      )}
    </div>
  );
}
