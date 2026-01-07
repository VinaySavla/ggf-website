import Link from "next/link";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

async function getUpcomingEvents() {
  try {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        eventDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        eventDate: 'asc',
      },
      take: 3,
    });
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export default async function FeaturedEvents() {
  const events = await getUpcomingEvents();

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Upcoming Events
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay updated with our latest events and be part of our growing community.
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col"
              >
                <div className="p-6 flex-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 ${
                    event.type === 'Tournament' 
                      ? 'bg-primary-100 text-primary-700' 
                      : event.type === 'Competition'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-primary-100 text-accent-700'
                  }`}>
                    {event.type}
                  </span>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description?.replace(/<[^>]*>/g, '')}
                  </p>
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
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <Link
                    href={`/events/${event.slug}`}
                    className="flex-1 inline-flex items-center justify-center text-primary hover:text-primary-600 font-semibold text-sm border border-primary rounded-lg px-4 py-2 hover:bg-primary-50 transition"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/events/${event.slug}`}
                    className="flex-1 inline-flex items-center justify-center bg-primary text-white font-semibold text-sm rounded-lg px-4 py-2 hover:bg-primary-600 transition"
                  >
                    Register Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No upcoming events at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new events!</p>
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/events"
            className="inline-flex items-center bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-primary-600 transition"
          >
            View All Events
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
