import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trophy, Plus, Users } from "lucide-react";
import TeamActions from "@/components/admin/TeamActions";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Teams Management - GGF Admin",
};

async function getTeams(userId, role) {
  const isAdmin = role === "SUPER_ADMIN";
  
  return prisma.team.findMany({
    where: isAdmin ? {} : { tournament: { organizerId: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      tournament: {
        include: {
          event: true,
        },
      },
      _count: {
        select: { rosters: true },
      },
    },
  });
}

export default async function TeamsPage() {
  const session = await auth();
  const teams = await getTeams(session.user.id, session.user.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage tournament teams and rosters</p>
        </div>
        <Link
          href="/admin/teams/new"
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Team</span>
        </Link>
      </div>

      {teams.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-14 h-14 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: team.color || '#6B1E9B' }}
                >
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <Trophy className="w-7 h-7 text-white" />
                  )}
                </div>
                <TeamActions team={team} userRole={session.user.role} />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">{team.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{team.tournament.event.title}</p>

              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                {team._count.rosters} players
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No teams yet</p>
          <Link
            href="/admin/teams/new"
            className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Team</span>
          </Link>
        </div>
      )}
    </div>
  );
}
