import { notFound } from "next/navigation";
import { Calendar, MapPin, Users, CreditCard, CheckCircle } from "lucide-react";
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
    description: event.description,
  };
}

async function getEvent(slug) {
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { registrations: true },
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

  const isPast = event.eventDate && new Date(event.eventDate) < new Date();
  const isAlreadyRegistered = session 
    ? await checkExistingRegistration(event.id, session.user.id, session.user.email)
    : false;

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          {/* Event Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  event.type === 'Tournament'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-accent-100 text-accent-700'
                }`}
              >
                {event.type}
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

            <p className="text-gray-600 mb-6">{event.description}</p>

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
                <span>{event._count.registrations} registered</span>
              </div>
              {event.isPaid && (
                <div className="flex items-center text-gray-600">
                  <CreditCard className="w-5 h-5 mr-3 text-primary" />
                  <span>Payment Required</span>
                </div>
              )}
            </div>
          </div>

          {/* Registration Form */}
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
          ) : !isPast ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Register for this Event
              </h2>
              <RegistrationForm event={event} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <p className="text-gray-500 text-lg">
                This event has already ended. Thank you for your interest!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
