import { prisma } from "@/lib/prisma";

export async function canManageEvent(eventId, user) {
  if (!user?.id || user.isActive === false) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const event = await prisma.event.findFirst({
    where: { id: eventId, OR: [{ organizerId: user.id }, { tournament: { organizerId: user.id } }] },
    select: { id: true },
  });
  return Boolean(event);
}

export async function canReviewEventPayments(eventId, user, client = prisma) {
  if (!user?.id || user.isActive === false) return false;
  if (user.role === "SUPER_ADMIN") return true;
  const event = await client.event.findFirst({
    where: {
      id: eventId,
      OR: [
        { organizerId: user.id },
        { tournament: { organizerId: user.id } },
        { financeAssignments: { some: { reviewerId: user.id, isActive: true } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(event);
}
