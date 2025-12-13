import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Trophy, Plus, UserCheck, UserX, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import PlayerActions from "@/components/admin/PlayerActions";
import AddPlayerButton from "@/components/admin/AddPlayerButton";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Users Management - GGF Admin",
};

async function getPlayers() {
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

  // Get all user IDs that have player profiles
  const userIds = players.filter(p => p.userId).map(p => p.userId);
  
  // Count registrations for each user
  if (userIds.length > 0) {
    const registrations = await prisma.registration.findMany({
      where: {
        paymentStatus: "paid",
      },
      select: {
        userData: true,
      },
    });

    // Create a map of userId -> registration count
    const registrationCounts = {};
    registrations.forEach(reg => {
      const userId = reg.userData?.userId;
      if (userId && userIds.includes(userId)) {
        registrationCounts[userId] = (registrationCounts[userId] || 0) + 1;
      }
    });

    // Attach registration count to each player
    return players.map(player => ({
      ...player,
      eventCount: player.userId ? (registrationCounts[player.userId] || 0) : 0,
    }));
  }

  return players.map(player => ({ ...player, eventCount: 0 }));
}

async function getUsersWithoutPlayers() {
  return prisma.user.findMany({
    where: {
      userProfile: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
    },
    orderBy: { name: "asc" },
  });
}

export default async function PlayersAdminPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const [players, usersWithoutPlayers] = await Promise.all([
    getPlayers(),
    getUsersWithoutPlayers(),
  ]);

  // Helper to get player display name
  const getPlayerName = (player) => player.user?.name || player.name || "Unknown";
  const getPlayerEmail = (player) => player.user?.email || player.email || "-";
  const getPlayerMobile = (player) => player.user?.mobile || player.mobile || "-";

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user profiles and stats</p>
        </div>
        <AddPlayerButton usersWithoutPlayers={usersWithoutPlayers} />
      </div>

      {players.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">User ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Account</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Events</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Teams</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stats</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Joined</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      href={`/admin/user/${player.playerId}`}
                      className="flex items-center space-x-3 group"
                    >
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {getPlayerName(player)?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-primary transition">
                        {getPlayerName(player)}
                      </span>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/user/${player.playerId}`}>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded text-primary hover:bg-primary/10 transition">
                        {player.playerId}
                      </code>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{getPlayerEmail(player)}</p>
                      <p className="text-gray-500">{getPlayerMobile(player)}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {player.userId ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <UserCheck className="w-3 h-3" />
                        Linked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        <UserX className="w-3 h-3" />
                        Not Linked
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {player.eventCount}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="w-4 h-4 mr-1" />
                      {player._count.tournamentRosters}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {player._count.statsRecords} records
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(player.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <PlayerActions 
                      player={player} 
                      usersWithoutPlayers={usersWithoutPlayers}
                      canDelete={session.user.role === "SUPER_ADMIN"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No users registered yet</p>
          <AddPlayerButton usersWithoutPlayers={usersWithoutPlayers} />
        </div>
      )}
    </div>
  );
}
