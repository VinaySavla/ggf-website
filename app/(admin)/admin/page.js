import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";

// Force dynamic rendering since we fetch from database
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Admin Dashboard - GGF Community Portal",
};

async function getDashboardStats(userId, role) {
  const isAdmin = role === "SUPER_ADMIN";
  
  const [
    totalEvents,
    pendingRegistrations,
    totalUsers,
    totalAccounts,
  ] = await Promise.all([
    prisma.event.count(isAdmin ? {} : {
      where: { tournament: { organizerId: userId } }
    }),
    prisma.registration.count({
      where: { 
        paymentStatus: "pending",
        ...(isAdmin ? {} : { event: { tournament: { organizerId: userId } } })
      }
    }),
    prisma.masterPlayer.count(),
    isAdmin ? prisma.user.count() : Promise.resolve(0),
  ]);

  const recentRegistrations = await prisma.registration.findMany({
    where: isAdmin ? {} : { event: { tournament: { organizerId: userId } } },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { event: true },
  });

  return {
    totalEvents,
    pendingRegistrations,
    totalUsers,
    totalAccounts,
    recentRegistrations,
  };
}

export default async function AdminDashboard() {
  const session = await auth();
  const stats = await getDashboardStats(session.user.id, session.user.role);

  const statCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      icon: Calendar,
      color: "bg-blue-500",
      href: "/admin/events",
    },
    {
      title: "Pending Registrations",
      value: stats.pendingRegistrations,
      icon: ClipboardList,
      color: "bg-yellow-500",
      href: "/admin/registrations",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-green-500",
      href: "/admin/user",
    },
  ];

  if (session.user.role === "SUPER_ADMIN") {
    statCards.push({
      title: "Total Accounts",
      value: stats.totalAccounts,
      icon: TrendingUp,
      color: "bg-purple-500",
      href: "/admin/users",
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {session.user.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Registrations */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
          <Link
            href="/admin/registrations"
            className="text-primary hover:text-primary-600 text-sm font-medium flex items-center"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {stats.recentRegistrations.length > 0 ? (
          <div className="space-y-4">
            {stats.recentRegistrations.map((reg) => (
              <div
                key={reg.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {reg.userData?.firstName} {reg.userData?.middleName} {reg.userData?.surname || "Anonymous"}
                  </p>
                  <p className="text-sm text-gray-500">{reg.event.title}</p>
                </div>
                <div className="flex items-center">
                  {reg.paymentStatus === "paid" ? (
                    <span className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Paid
                    </span>
                  ) : reg.paymentStatus === "pending" ? (
                    <span className="flex items-center text-yellow-600 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      Pending
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No recent registrations</p>
        )}
      </div>
    </div>
  );
}
