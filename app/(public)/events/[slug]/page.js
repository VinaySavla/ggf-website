import { notFound } from "next/navigation";
import { Calendar, MapPin, Users, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import RegistrationForm from "@/components/public/RegistrationForm";
import { sanitizeRichText } from "@/lib/sanitize";
import { BookmarkButton, WaitlistButton } from "@/components/public/EventMemberActions";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) return { title: "Event Not Found" };
  
  return {
    title: `${event.title} - GGF Community Portal`,
    description: event.description?.replace(/<[^>]*>/g, '').substring(0, 160),
  };
}

async function getEvent(slug) {
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        registrations: {
          where: { status: "active" },
          select: { gender: true },
        },
        sports: {
          include: { sport: true },
        },
        tournament: { select: { id: true } },
        galleryCollections: { where: { isActive: true }, select: { slug: true, name: true, coverImage: true }, take: 3 },
      },
    });
    return event;
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return null;
  }
}

async function checkExistingRegistration(eventId, userId, userEmail) {
  if (!userId) return false;
  
  const existing = await prisma.registration.findFirst({
    where: {
      eventId,
      status: "active",
      OR: [
        { userId },
        { userData: { path: ["userId"], equals: userId } },
        { userData: { path: ["email"], equals: userEmail } },
      ],
    },
  });
  
  return !!existing;
}

export default async function EventDetailPage({ params }) {
  const { slug } = await params;
  const [event, session] = await Promise.all([
    getEvent(slug),
    auth(),
  ]);

  if (!event) {
    notFound();
  }

  const now = new Date();
  const isPast = event.eventDate && new Date(event.eventDate) < now;
  const isAlreadyRegistered = session 
    ? await checkExistingRegistration(event.id, session.user.id, session.user.email)
    : false;
  const bookmark = session ? await prisma.eventBookmark.findUnique({ where: { userId_eventId: { userId: session.user.id, eventId: event.id } } }) : null;

  // Check registration window
  const registrationNotStarted = event.registrationStartDate && new Date(event.registrationStartDate) > now;
  const registrationClosed = event.registrationEndDate && new Date(event.registrationEndDate) < now;

  // Calculate registration counts
  const totalRegistrations = event.registrations.length;
  const maleRegistrations = event.registrations.filter(r => r.gender === "Male").length;
  const femaleRegistrations = event.registrations.filter(r => r.gender === "Female").length;
  const otherRegistrations = event.registrations.filter(r => r.gender === "Other").length;

  // Check if registration limit is reached
  let limitReached = false;
  let limitMessage = "";
  
  if (event.registrationCountType === "common" && event.maxTotalRegistrations) {
    if (totalRegistrations >= event.maxTotalRegistrations) {
      limitReached = true;
      limitMessage = "Registration limit has been reached";
    }
  } else if (event.registrationCountType === "separate") {
    const userGender = session?.user?.gender;
    if (userGender === "Male" && event.maxMaleRegistrations && maleRegistrations >= event.maxMaleRegistrations) {
      limitReached = true;
      limitMessage = "Male registration limit has been reached";
    }
    if (userGender === "Female" && event.maxFemaleRegistrations && femaleRegistrations >= event.maxFemaleRegistrations) {
      limitReached = true;
      limitMessage = "Female registration limit has been reached";
    }
    if (userGender === "Other" && event.maxOtherRegistrations && otherRegistrations >= event.maxOtherRegistrations) {
      limitReached = true;
      limitMessage = "Other-gender registration limit has been reached";
    }
  }

  const canRegister = !isPast && !registrationNotStarted && !registrationClosed && !limitReached && !isAlreadyRegistered;

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            {session && <div className="flex justify-end mb-4"><BookmarkButton eventId={event.id} initial={Boolean(bookmark)} /></div>}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  event.type === 'Tournament'
                    ? 'bg-primary-100 text-primary-700'
                    : event.type === 'Competition'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-primary-100 text-accent-700'
                }`}
              >
                {event.type}{event.tournamentType ? ` - ${event.tournamentType}` : ''}
              </span>
              {event.isPaid && (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                  Paid Event
                </span>
              )}
              {isPast && (
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                  Past Event
                </span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {event.title}
            </h1>

            {event.description && (
              <div 
                className="text-gray-600 mb-6 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.description) }}
              />
            )}

            {/* Eligibility Criteria */}
            {event.eligibility && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Eligibility Criteria</h3>
                <div 
                  className="text-blue-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(event.eligibility) }}
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {event.eventDate && (
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-primary" />
                  <span>{formatDate(event.eventDate)}</span>
                </div>
              )}
              {event.venue && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-primary" />
                  <span>{event.venue}</span>
                </div>
              )}
              <div className="flex items-center text-gray-600">
                <Users className="w-5 h-5 mr-3 text-primary" />
                <span>
                  {totalRegistrations} registered
                  {event.registrationCountType === "common" && event.maxTotalRegistrations && (
                    <span className="text-gray-400"> / {event.maxTotalRegistrations} max</span>
                  )}
                </span>
              </div>
              {event.isPaid && (
                <div className="flex items-center text-gray-600">
                  <CreditCard className="w-5 h-5 mr-3 text-primary" />
                  <span>Payment Required</span>
                </div>
              )}
            </div>

            {/* Registration Window Info */}
            {(event.registrationStartDate || event.registrationEndDate) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Registration: 
                    {event.registrationStartDate && ` Opens ${formatDate(event.registrationStartDate)}`}
                    {event.registrationStartDate && event.registrationEndDate && ' -'}
                    {event.registrationEndDate && ` Closes ${formatDate(event.registrationEndDate)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Separate Gender Counts */}
            {event.registrationCountType === "separate" && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-blue-800 font-medium">Male:</span>{" "}
                  {maleRegistrations}
                  {event.maxMaleRegistrations && <span className="text-blue-600"> / {event.maxMaleRegistrations}</span>}
                </div>
                <div className="bg-pink-50 rounded-lg p-3">
                  <span className="text-pink-800 font-medium">Female:</span>{" "}
                  {femaleRegistrations}
                  {event.maxFemaleRegistrations && <span className="text-pink-600"> / {event.maxFemaleRegistrations}</span>}
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-purple-800 font-medium">Other:</span>{" "}{otherRegistrations}
                  {event.maxOtherRegistrations && <span className="text-purple-600"> / {event.maxOtherRegistrations}</span>}
                </div>
              </div>
            )}
          </div>
          {event.tournament && <div className="mb-8"><a href={`/tournaments/${event.tournament.id}`} className="block bg-primary text-white rounded-xl p-5 text-center font-semibold">View teams, fixtures, results and standings →</a></div>}
          {event.galleryCollections.length > 0 && <div className="mb-8 bg-white border rounded-xl p-6"><h2 className="text-xl font-bold mb-3">Event gallery</h2><div className="flex flex-wrap gap-3">{event.galleryCollections.map(collection=><a key={collection.slug} href={`/gallery/${collection.slug}`} className="text-primary font-medium">{collection.name} →</a>)}</div></div>}

          {/* Registration Form or Status Messages */}
          {isAlreadyRegistered ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Already Registered!
              </h2>
              <p className="text-gray-600">
                You have already registered for this event. We look forward to seeing you!
              </p>
            </div>
          ) : registrationNotStarted ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <Clock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Not Yet Open
              </h2>
              <p className="text-gray-600">
                Registration opens on {formatDate(event.registrationStartDate)}
              </p>
            </div>
          ) : registrationClosed ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Closed
              </h2>
              <p className="text-gray-600">
                Registration for this event has closed on {formatDate(event.registrationEndDate)}
              </p>
            </div>
          ) : limitReached ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Registration Full
              </h2>
              <p className="text-gray-600">{limitMessage}</p>
              {session && <div className="mt-4"><WaitlistButton eventId={event.id}/></div>}
            </div>
          ) : isPast ? (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-lg">
                This event has already ended. Thank you for your interest!
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Register for this Event
              </h2>
              <RegistrationForm event={event} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
