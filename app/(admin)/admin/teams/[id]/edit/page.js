import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import TeamForm from "@/components/admin/TeamForm";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Edit Team - GGF Admin",
};

async function getTeam(id, userId, role) {
  const isAdmin = role === "SUPER_ADMIN";
  
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      tournament: {
        include: {
          event: { select: { title: true } },
        },
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

async function getTournaments(userId, role) {
  const isAdmin = role === "SUPER_ADMIN";
  
  return prisma.tournamentMaster.findMany({
    where: isAdmin ? {} : { organizerId: userId },
    include: {
      event: {
        select: { title: true },
      },
    },
  });
}

export default async function EditTeamPage({ params }) {
  const session = await auth();
  
  if (!session || (session.user.role !== "ORGANIZER" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/admin");
  }

  const { id } = await params;
  const [team, tournaments] = await Promise.all([
    getTeam(id, session.user.id, session.user.role),
    getTournaments(session.user.id, session.user.role),
  ]);

  if (!team) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Team</h1>
        <p className="text-gray-600">Update team details for {team.name}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <TeamForm team={team} tournaments={tournaments} />
      </div>
    </div>
  );
}
