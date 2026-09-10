import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSports } from "@/actions/stats.actions";
import SportsManager from "@/components/admin/SportsManager";
import StatDefinitions from "@/components/admin/StatDefinitions";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Sports Management - GGF Admin",
};

export default async function SportsPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const { sports, error } = await getSports();
  const sportsWithDefinitions = await prisma.sport.findMany({ include: { statDefinitions: { orderBy: { sortOrder: "asc" } } }, orderBy: { name: "asc" } });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sports Management</h1>
        <p className="text-gray-600">Manage sports categories for player statistics</p>
      </div>

      <SportsManager initialSports={sports || []} />
      <StatDefinitions sports={sportsWithDefinitions} />
    </div>
  );
}
