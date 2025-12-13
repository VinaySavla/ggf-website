import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeamForm from "@/components/admin/TeamForm";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Create Team - GGF Admin",
};

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

export default async function NewTeamPage() {
  const session = await auth();
  const tournaments = await getTournaments(session.user.id, session.user.role);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Team</h1>
        <p className="text-gray-600">Add a new team to a tournament</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <TeamForm tournaments={tournaments} />
      </div>
    </div>
  );
}
