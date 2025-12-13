import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EventForm from "@/components/admin/EventForm";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Edit Event - GGF Admin",
};

async function getEvent(id, userId, role) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tournament: true,
      sports: {
        include: { sport: true },
      },
    },
  });

  if (!event) return null;

  // Check ownership for organizers
  if (role === "ORGANIZER" && event.tournament?.organizerId !== userId) {
    return null;
  }

  return event;
}

async function getOrganizers() {
  return prisma.user.findMany({
    where: { role: "ORGANIZER" },
    select: { id: true, name: true, email: true },
  });
}

async function getSports() {
  return prisma.sport.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function EditEventPage({ params }) {
  const { id } = await params;
  const session = await auth();
  const event = await getEvent(id, session.user.id, session.user.role);

  if (!event) {
    notFound();
  }

  const [organizers, sports] = await Promise.all([
    session.user.role === "SUPER_ADMIN" ? getOrganizers() : [],
    getSports(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600">Update the event details</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <EventForm 
          event={event}
          organizers={organizers}
          sports={sports}
          userRole={session.user.role}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
