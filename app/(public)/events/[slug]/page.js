import { notFound } from "next/navigation";
import { Calendar, MapPin, Users, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";
import RegistrationForm from "@/components/public/RegistrationForm";

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
          select: { gender: true },
        },
        sports: {
          include: { sport: true },
        },
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
      OR: [
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

  // Check registration window
  const registrationNotStarted = event.registrationStartDate && new Date(event.registrationStartDate) > now;
  const registrationClosed = event.registrationEndDate && new Date(event.registrationEndDate) < now;

  // Calculate registration counts
  const totalRegistrations = event.registrations.length;
  const maleRegistrations = event.registrations.filter(r => r.gender === "Male").length;
  const femaleRegistrations = event.registrations.filter(r => r.gender === "Female").length;

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
  }

  const canRegister = !isPast && !registrationNotStarted && !registrationClosed && !limitReached && !isAlreadyRegistered;

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  event.type === 'Tournament'
                    ? 'bg-primary-100 text-primary-700'
                    : event.type === 'Competition'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-accent-100 text-accent-700'
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
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            )}

            {/* Eligibility Criteria */}
            {event.eligibility && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">Eligibility Criteria</h3>
                <div 
                  className="text-blue-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.eligibility }}
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
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
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
              </div>
            )}
          </div>

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
