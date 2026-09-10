import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { sanitizeRichText } from "@/lib/sanitize";

// Force dynamic rendering since we fetch from database
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Events - GGF Community Portal",
  description: "Browse and register for upcoming events organized by Godhra Graduates Forum.",
};

async function getEvents(filters = {}) {
  try {
    const events = await prisma.event.findMany({
      where: {
        isActive: true,
        ...(filters.q ? { OR: [{ title: { contains: filters.q, mode: 'insensitive' } }, { venue: { contains: filters.q, mode: 'insensitive' } }, { village: { contains: filters.q, mode: 'insensitive' } }] } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.paid === 'free' ? { isPaid: false } : filters.paid === 'paid' ? { isPaid: true } : {}),
      },
      orderBy: { eventDate: 'asc' },
      include: {
        _count: {
          select: { registrations: { where: { status: "active" } } },
        },
      },
    });
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export default async function EventsPage({ searchParams }) {
  const params = await searchParams;
  const filters = { q: params.q?.trim() || '', type: params.type || '', paid: params.paid || '' };
  const view = params.view === 'calendar' ? 'calendar' : 'cards';
  const events = await getEvents(filters);

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
        <div className="home-hero rounded-2xl border border-primary/10 p-6 sm:p-10 mb-8">
          <p className="eyebrow mb-3">Meet. Play. Learn.</p>
          <h1 className="text-4xl font-semibold tracking-tight text-primary-900 mb-4">Find your next event</h1>
          <p className="text-gray-600 max-w-2xl leading-7">
            Discover and participate in our upcoming events. From sports tournaments to
            educational workshops, there's something for everyone.
          </p>
        </div>

        <form className="grid sm:grid-cols-4 gap-3 bg-white border shadow-sm rounded-2xl p-5 mb-8">
          <input type="hidden" name="view" value={view} />
          <label htmlFor="event-search" className="sr-only">Search events</label><input id="event-search" name="q" defaultValue={filters.q} placeholder="Search event, venue or village" className="sm:col-span-2 border rounded-lg px-4 py-3" />
          <label htmlFor="event-type" className="sr-only">Event type</label><select id="event-type" name="type" defaultValue={filters.type} className="border rounded-lg px-3 py-3"><option value="">All types</option><option>Seminar</option><option>Competition</option><option>Tournament</option></select>
          <label htmlFor="event-payment" className="sr-only">Payment type</label><select id="event-payment" name="paid" defaultValue={filters.paid} className="border rounded-lg px-3 py-3"><option value="">Free & paid</option><option value="free">Free</option><option value="paid">Paid</option></select>
          <div className="sm:col-span-4 flex flex-wrap items-center gap-4"><button className="btn-primary text-sm">Apply filters</button>{(filters.q || filters.type || filters.paid) && <Link href={{ pathname: '/events', query: { view } }} className="text-sm font-medium text-primary underline underline-offset-4">Clear filters</Link>}</div>
        </form>

        <div className="flex justify-end gap-2 mb-6">
          <Link href={{ pathname: '/events', query: { ...filters, view: 'cards' } }} className={`px-3 py-2 rounded-lg text-sm ${view === 'cards' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>Card view</Link>
          <Link href={{ pathname: '/events', query: { ...filters, view: 'calendar' } }} className={`px-3 py-2 rounded-lg text-sm ${view === 'calendar' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>Calendar view</Link>
        </div>

        {view === 'calendar' && <EventCalendar events={events} />}

        {/* Upcoming Events */}
        {view === 'cards' && <section className="mb-16">
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
        </section>}

        {/* Past Events */}
        {view === 'cards' && pastEvents.length > 0 && (
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

function EventCalendar({ events }) {
  const groups = new Map();
  for (const event of events) {
    if (!event.eventDate) continue;
    const date = new Date(event.eventDate);
    const key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  return <div className="space-y-8 mb-16">{[...groups.entries()].map(([month, monthEvents]) => <section key={month}><h2 className="text-xl font-bold border-b pb-2 mb-3">{month}</h2><div className="space-y-2">{monthEvents.map(event => <Link key={event.id} href={`/events/${event.slug}`} className="grid grid-cols-[4rem_1fr_auto] gap-4 items-center border rounded-xl p-4 hover:bg-primary-50"><div className="text-center"><p className="text-2xl font-bold text-primary">{new Date(event.eventDate).getDate()}</p><p className="text-xs text-gray-500">{new Date(event.eventDate).toLocaleDateString('en-IN', { weekday: 'short' })}</p></div><div><p className="font-semibold">{event.title}</p><p className="text-sm text-gray-500">{event.venue || 'Venue to be announced'}</p></div><span className="text-xs text-gray-500">{event.type}</span></Link>)}</div></section>)}{groups.size === 0 && <p className="bg-gray-50 rounded-xl p-10 text-center text-gray-500">No dated events match these filters.</p>}</div>;
}

function EventCard({ event, isPast = false }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 ${
        isPast ? '' : 'hover:shadow-lg transition-shadow duration-200'
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
                : 'bg-primary-100 text-accent-700'
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
        <div className="text-gray-600 text-sm mb-4 line-clamp-2 break-words" dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.description || "") }} />

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
