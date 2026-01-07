import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Plus } from "lucide-react";
import UserActions from "@/components/admin/UserActions";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Users Management - GGF Admin",
};

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      userProfile: true,
      _count: {
        select: { createdEvents: true },
      },
    },
  });
}

export default async function UsersPage() {
  const session = await auth();

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  const users = await getUsers();

  const organizers = users.filter((u) => u.role === "ORGANIZER");
  const players = users.filter((u) => u.role === "PLAYER");
  const admins = users.filter((u) => u.role === "SUPER_ADMIN");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Creation</h1>
          <p className="text-gray-600">Create and manage system users</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add User</span>
        </Link>
      </div>

      {/* Organizers Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizers</h2>
        {organizers.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mobile</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Events</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {organizers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{`${user.firstName} ${user.middleName} ${user.surname}`}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.mobile || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user._count.createdEvents}</td>
                    <td className="px-6 py-4 text-right">
                      <UserActions user={user} currentUserId={session.user.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-gray-500">No organizers yet</p>
          </div>
        )}
      </section>

      {/* Super Admins Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Super Admins</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Mobile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{`${user.firstName} ${user.middleName} ${user.surname}`}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.mobile || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Players Summary */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Players ({players.length})
        </h2>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-600">
            {players.length} registered players in the system.{" "}
            <Link href="/admin/user" className="text-primary hover:underline">
              View all players
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
