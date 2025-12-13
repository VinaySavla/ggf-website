import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTournaments, getSports, getGeneralStats } from "@/actions/stats.actions";
import { Trophy, BarChart3, ArrowRight, Calendar, Users, Activity } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Player Stats - GGF Admin",
};

export default async function StatsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [tournamentsResult, sportsResult, generalStatsResult] = await Promise.all([
    getTournaments(),
    getSports(),
    getGeneralStats(),
  ]);

  const tournaments = tournamentsResult.tournaments || [];
  const sports = sportsResult.sports || [];
  const generalStats = generalStatsResult.stats || [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Player Statistics</h1>
        <p className="text-gray-600">Manage player performance stats - tournament or general</p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
              <p className="text-sm text-gray-500">Tournaments</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{sports.length}</p>
              <p className="text-sm text-gray-500">Sports Categories</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{generalStats.length}</p>
              <p className="text-sm text-gray-500">General Stats Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sports Check */}
      {sports.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
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
      )}

      {/* General Stats Card */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">General Stats</h3>
              <p className="text-sm text-gray-600">
                Add player stats not linked to any tournament (e.g., Career Stats, Season Stats)
              </p>
            </div>
          </div>
          <Link
            href="/admin/stats/general"
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            Manage General Stats
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Tournaments List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-900">Tournament-Linked Stats</h2>
          <p className="text-sm text-gray-500">Select a tournament to enter stats for its participants</p>
        </div>

        {tournaments.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/admin/stats/${tournament.id}`}
                className="flex items-center justify-between p-6 hover:bg-gray-50 transition group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition">
                      {tournament.event.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      {tournament.event.eventDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(tournament.event.eventDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {tournament._count.rosters} players in teams
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {tournament._count.statsRecords} stats records
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tournaments found</p>
            <p className="text-sm text-gray-400 mt-1">
              Create a tournament event to start tracking player stats
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
