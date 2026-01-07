import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Calendar, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import EventActions from "@/components/admin/EventActions";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Events Management - GGF Admin",
};

async function getEvents(userId, role) {
  const isAdmin = role === "SUPER_ADMIN";
  
  const events = await prisma.event.findMany({
    where: isAdmin ? {} : { tournament: { organizerId: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { registrations: true } },
      tournament: {
        include: {
          organizer: { 
            select: { 
              firstName: true,
              middleName: true,
              surname: true
            } 
          },
        },
      },
    },
  });
  
  return events;
}

export default async function EventsPage() {
  const session = await auth();
  const events = await getEvents(session.user.id, session.user.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600">Manage your events and registrations</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Create Event</span>
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Event</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Registrations</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      {session.user.role === "SUPER_ADMIN" && event.tournament?.organizer && (
                        <p className="text-xs text-gray-500">
                          By: {`${event.tournament.organizer.firstName} ${event.tournament.organizer.middleName} ${event.tournament.organizer.surname}`}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      event.type === "Tournament"
                        ? "bg-primary-100 text-primary-700"
                        : "bg-primary-100 text-accent-700"
                    }`}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {event.eventDate ? formatDate(event.eventDate) : "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-1" />
                      {event._count.registrations}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      event.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {event.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <EventActions event={event} userRole={session.user.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No events yet</p>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Your First Event</span>
          </Link>
        </div>
      )}
    </div>
  );
}
