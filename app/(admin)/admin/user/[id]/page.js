import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Trophy, Calendar, ArrowLeft, Mail, Phone, Shield, Edit, User } from "lucide-react";
import ProfileImageEditor from "@/components/admin/ProfileImageEditor";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const player = await getPlayerBasic(id);
  if (!player) return { title: "User Not Found" };
  
  const playerName = player.user?.name || player.name || "Unknown User";
  return {
    title: `${playerName} - User Profile - GGF Admin`,
    description: `User profile for ${playerName}`,
  };
}

async function getPlayerBasic(playerId) {
  try {
    return await prisma.masterPlayer.findUnique({
      where: { playerId },
      include: {
        user: {
          select: { name: true },
        },
      },
    });
  } catch (error) {
    return null;
  }
}

async function getPlayerFull(playerId) {
  try {
    const player = await prisma.masterPlayer.findUnique({
      where: { playerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            photo: true,
            role: true,
            createdAt: true,
          },
        },
        tournamentRosters: {
          include: {
            tournament: {
              include: {
                event: true,
              },
            },
            team: true,
          },
        },
        statsRecords: {
          include: {
            sport: true,
            tournament: {
              include: {
                event: true,
              },
            },
          },
        },
      },
    });
    
    if (!player) return null;
    
    // Also fetch tournament registrations for this user (if user is linked)
    let tournamentRegistrations = [];
    if (player.userId) {
      tournamentRegistrations = await prisma.registration.findMany({
        where: {
          userData: {
            path: ["userId"],
            equals: player.user.id,
          },
          event: {
            type: "Tournament",
          },
        },
        include: {
          event: {
            include: {
              tournament: true,
            },
          },
        },
      });
    }
    
    // Attach registrations to player object
    return {
      ...player,
      tournamentRegistrations,
    };
  } catch (error) {
    console.error("Failed to fetch player:", error);
    return null;
  }
}

// Check if organizer has access to view this player (registered for their events)
async function canOrganizerViewPlayer(organizerId, playerId) {
  // Get the userId from the player
  const player = await prisma.masterPlayer.findUnique({
    where: { playerId },
    select: { userId: true },
  });
  
  if (!player) return false;

  // Check if this player has registered for any event organized by this organizer
  const registration = await prisma.registration.findFirst({
    where: {
      event: {
        tournament: {
          organizerId: organizerId,
        },
      },
      userData: {
        path: ["userId"],
        equals: player.userId,
      },
    },
  });

  return !!registration;
}

export default async function AdminPlayerProfilePage({ params }) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const player = await getPlayerFull(id);

  if (!player) {
    notFound();
  }

  // Access Control
  const isAdmin = session.user.role === "SUPER_ADMIN";
  const isOrganizer = session.user.role === "ORGANIZER";
  const isOwnProfile = player.userId && session.user.id === player.userId;

  // Check access permissions
  let hasAccess = false;
  
  if (isAdmin) {
    hasAccess = true;
  } else if (isOwnProfile) {
    hasAccess = true;
  } else if (isOrganizer) {
    hasAccess = await canOrganizerViewPlayer(session.user.id, id);
  }

  if (!hasAccess) {
    return (
      <div className="py-12">
        <div className="container-custom">
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You don't have permission to view this user profile.
              {isOrganizer && " You can only view profiles of users who have registered for your events."}
            </p>
            <Link
              href="/admin/user"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Users
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin/user"
            className="inline-flex items-center text-gray-600 hover:text-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        </div>
        {isOwnProfile && (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full">
            <User className="w-4 h-4" />
            Your Profile
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Player Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="relative w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {(player.user?.photo || player.photo) ? (
                <Image
                  src={player.user?.photo || player.photo}
                  alt={player.user?.name || player.name || "Player"}
                  width={128}
                  height={128}
                  className="rounded-full object-cover w-full h-full"
                />
              ) : (
                <span className="text-5xl font-bold text-primary">
                  {(player.user?.name || player.name || "?")?.charAt(0).toUpperCase()}
                </span>
              )}
              {/* Profile Image Editor - visible to admin or own profile */}
              {(isAdmin || isOwnProfile) && (
                <ProfileImageEditor 
                  currentPhoto={player.user?.photo || player.photo}
                  userId={player.user?.id}
                  playerId={player.playerId}
                  canEdit={isAdmin || isOwnProfile}
                />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {player.user?.name || player.name || "Unknown Player"}
            </h2>
            <p className="text-primary font-mono text-sm mb-2">
              {player.playerId}
            </p>
            {!player.userId && (
              <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full mb-2">
                No Account Linked
              </span>
            )}
            {player.bio && (
              <p className="text-gray-600 text-sm mb-4">{player.bio}</p>
            )}
            
            <div className="flex items-center justify-center space-x-6 py-4 border-t border-gray-100">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {(player.tournamentRosters?.length || 0) + (player.tournamentRegistrations?.length || 0)}
                </div>
                <div className="text-sm text-gray-500">Tournaments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {player.statsRecords.length}
                </div>
                <div className="text-sm text-gray-500">Stats</div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Contact Information
            </h3>
            <div className="space-y-3">
              {(player.user?.email || player.email) ? (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${player.user?.email || player.email}`} className="text-gray-900 hover:text-primary">
                    {player.user?.email || player.email}
                  </a>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No email provided</p>
              )}
              {(player.user?.mobile || player.mobile) && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${player.user?.mobile || player.mobile}`} className="text-gray-900 hover:text-primary">
                    {player.user?.mobile || player.mobile}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Account Info - only show if user is linked */}
          {player.user && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Role</span>
                  <span className="font-medium text-gray-900">{player.user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {new Date(player.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Player Created Info - show if no user linked */}
          {!player.user && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Player Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium text-yellow-600">Standalone Player</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium text-gray-900">
                    {new Date(player.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats and Tournament History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tournament History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-primary" />
              Tournament History
            </h3>
            
            {((player.tournamentRosters?.length || 0) + (player.tournamentRegistrations?.length || 0)) > 0 ? (
              <div className="space-y-4">
                {/* Tournament Registrations */}
                {player.tournamentRegistrations?.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {reg.event.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Status: <span className={`font-medium ${
                          reg.paymentStatus === 'paid' ? 'text-green-600' : 
                          reg.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {reg.paymentStatus.charAt(0).toUpperCase() + reg.paymentStatus.slice(1)}
                        </span>
                      </p>
                      {reg.event.eventDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(reg.event.eventDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Registered
                    </span>
                  </div>
                ))}
                
                {/* Tournament Rosters (Team Assignments) */}
                {player.tournamentRosters?.map((roster) => (
                  <div
                    key={roster.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {roster.tournament.event.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Team: {roster.team.name}
                      </p>
                      {roster.tournament.event.eventDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(roster.tournament.event.eventDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {roster.auctionPrice > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Auction Price</p>
                        <p className="font-semibold text-primary">
                          ₹{roster.auctionPrice.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No tournament history yet.
              </p>
            )}
          </div>

          {/* Stats Records */}
          {player.statsRecords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Performance Stats
              </h3>
              <div className="space-y-4">
                {player.statsRecords.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {record.tournament 
                          ? record.tournament.event.title 
                          : record.label || "General Stats"}
                      </h4>
                      <div className="flex items-center gap-2">
                        {!record.tournament && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            General
                          </span>
                        )}
                        <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                          {record.sport.name}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(record.statsJson || {}).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold text-gray-900">
                            {value}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
