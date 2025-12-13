import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClipboardList, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import RegistrationActions from "@/components/admin/RegistrationActions";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Registrations - GGF Admin",
};

async function getRegistrations(userId, role, status) {
  const isAdmin = role === "SUPER_ADMIN";
  
  const where = {
    ...(status && status !== "all" ? { paymentStatus: status } : {}),
    ...(isAdmin ? {} : { event: { tournament: { organizerId: userId } } }),
  };

  const registrations = await prisma.registration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      event: true,
    },
  });

  // Fetch player profiles for all registrations that have userId
  const userIds = registrations
    .map(r => r.userData?.userId)
    .filter(Boolean);

  const playerProfiles = await prisma.masterPlayer.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, playerId: true },
  });

  // Create a map of userId -> playerId
  const playerMap = {};
  playerProfiles.forEach(p => {
    playerMap[p.userId] = p.playerId;
  });

  // Attach playerId to each registration
  return registrations.map(reg => ({
    ...reg,
    playerId: reg.userData?.userId ? playerMap[reg.userData.userId] : null,
  }));
}

export default async function RegistrationsPage({ searchParams }) {
  const session = await auth();
  const status = searchParams.status || "all";
  const registrations = await getRegistrations(session.user.id, session.user.role, status);

  const statusFilters = [
    { value: "all", label: "All", count: registrations.length },
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "paid", label: "Paid", color: "green" },
    { value: "rejected", label: "Rejected", color: "red" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Registrations</h1>
        <p className="text-gray-600">View and manage event registrations</p>
      </div>

      {/* Status Filters */}
      <div className="flex items-center space-x-2 mb-6">
        {statusFilters.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/registrations${filter.value !== "all" ? `?status=${filter.value}` : ""}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              status === filter.value
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {registrations.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Registrant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Event</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {registrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      <div>
                        {reg.playerId ? (
                          <Link 
                            href={`/admin/players/${reg.playerId}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {reg.userData?.name || "N/A"}
                          </Link>
                        ) : (
                          <p className="font-medium text-gray-900">
                            {reg.userData?.name || "N/A"}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {reg.userData?.email || reg.userData?.mobile || ""}
                        </p>
                        {reg.playerId && (
                          <p className="text-xs text-primary font-mono mt-1">{reg.playerId}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {reg.event.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(reg.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    {reg.event.isPaid ? (
                      <div className="text-sm">
                        {reg.transactionId && (
                          <p className="text-gray-600">TXN: {reg.transactionId}</p>
                        )}
                        {reg.paymentSs && (
                          <Link
                            href={reg.paymentSs}
                            target="_blank"
                            className="text-primary hover:underline"
                          >
                            View Screenshot
                          </Link>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Free Event</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
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
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejected
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <RegistrationActions 
                      registrationId={reg.id} 
                      currentStatus={reg.paymentStatus}
                      isPaid={reg.event.isPaid}
                      userRole={session.user.role}
                      playerId={reg.playerId}
                      playerName={reg.userData?.name}
                      userData={reg.userData}
                      formSchema={reg.event.formSchema}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No registrations found</p>
        </div>
      )}
    </div>
  );
}
