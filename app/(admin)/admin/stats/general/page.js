import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSports, getAllPlayers, getGeneralStats } from "@/actions/stats.actions";
import { ArrowLeft, Activity } from "lucide-react";
import GeneralStatsForm from "@/components/admin/GeneralStatsForm";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "General Stats - GGF Admin",
};

export default async function GeneralStatsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [sportsResult, playersResult, statsResult] = await Promise.all([
    getSports(),
    getAllPlayers(),
    getGeneralStats(),
  ]);

  const sports = sportsResult.sports || [];
  const players = playersResult.players || [];
  const existingStats = statsResult.stats || [];

  // Group existing stats by player
  const statsByPlayer = {};
  existingStats.forEach((stat) => {
    if (!statsByPlayer[stat.playerId]) {
      statsByPlayer[stat.playerId] = [];
    }
    statsByPlayer[stat.playerId].push(stat);
  });

  if (sports.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">General Stats</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
          <Activity className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="font-semibold text-yellow-800 mb-2">No Sports Configured</h3>
          <p className="text-yellow-700 mb-4">
            You need to add sports categories before you can enter player stats.
          </p>
          <Link
            href="/admin/sports"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
          >
            Manage Sports
          </Link>
        </div>
      </div>
    );
  }

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
        <h1 className="text-2xl font-bold text-gray-900">General Stats</h1>
        <p className="text-gray-600">
          Add player statistics not linked to any specific tournament (Career Stats, Season Stats, etc.)
        </p>
      </div>

      <GeneralStatsForm
        players={players}
        sports={sports}
        existingStats={statsByPlayer}
      />
    </div>
  );
}
