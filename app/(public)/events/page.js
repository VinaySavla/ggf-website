import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

// Force dynamic rendering since we fetch from database
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Events - GGF Community Portal",
  description: "Browse and register for upcoming events organized by Godhra Graduates Forum.",
};

async function getEvents() {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      orderBy: { eventDate: 'asc' },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  const upcomingEvents = events.filter(
    (e) => e.eventDate && new Date(e.eventDate) >= new Date()
  );
  const pastEvents = events.filter(
    (e) => e.eventDate && new Date(e.eventDate) < new Date()
  );

  return (
    <div className="py-12">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Events</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover and participate in our upcoming events. From sports tournaments to
            educational workshops, there's something for everyone.
          </p>
        </div>

        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500">No upcoming events at the moment.</p>
            </div>
          )}
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, isPast = false }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 ${
        isPast ? 'opacity-75' : 'hover:shadow-xl transition-shadow duration-300'
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              event.type === 'Tournament'
                ? 'bg-primary-100 text-primary-700'
                : event.type === 'Competition'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-accent-100 text-accent-700'
            }`}
          >
            {event.type}
          </span>
          {event.isPaid && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
              Paid
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description?.replace(/<[^>]*>/g, '')}</p>

        <div className="space-y-2 mb-4">
          {event.eventDate && (
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(event.eventDate)}
            </div>
          )}
          {event.venue && (
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-2" />
              {event.venue}
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Users className="w-4 h-4 mr-2" />
            {event._count.registrations} registered
          </div>
        </div>

        <Link
          href={`/events/${event.slug}`}
          className={`inline-block w-full text-center py-2 rounded-lg font-semibold transition ${
            isPast
              ? 'bg-gray-100 text-gray-600'
              : 'bg-primary text-white hover:bg-primary-600'
          }`}
        >
          {isPast ? 'View Details' : 'Register Now'}
        </Link>
      </div>
    </div>
  );
}
