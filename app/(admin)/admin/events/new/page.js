import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EventForm from "@/components/admin/EventForm";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Create Event - GGF Admin",
};

async function getOrganizers() {
  return prisma.user.findMany({
    where: { role: "ORGANIZER" },
    select: { id: true, firstName: true, middleName: true, surname: true, email: true },
  });
}

async function getSports() {
  return prisma.sport.findMany({
    orderBy: { name: "asc" },
  });
}

export default async function NewEventPage() {
  const session = await auth();
  const [organizers, sports] = await Promise.all([
    session.user.role === "SUPER_ADMIN" ? getOrganizers() : [],
    getSports(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-600">Fill in the details to create a new event</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <EventForm 
          organizers={organizers} 
          sports={sports}
          userRole={session.user.role}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
