import { prisma } from "@/lib/prisma";

export async function createNotification({ userId, type, title, message, href }, client = prisma) {
  if (!userId) return null;
  const user = await client.user.findUnique({ where: { id: userId }, select: { isActive: true, notificationPreferences: true } });
  if (!user?.isActive || user.notificationPreferences?.inApp === false) return null;
  if (type === "event_reminder" && user.notificationPreferences?.eventReminders === false) return null;
  if (["announcement", "moderation", "volunteer"].includes(type) && user.notificationPreferences?.communityUpdates === false) return null;
  return client.notification.create({ data: { userId, type, title, message, href } });
}

export async function notifyEventRegistrants(eventId, notification, client = prisma) {
  const registrations = await client.registration.findMany({
    where: { eventId, userId: { not: null }, status: "active" },
    select: { userId: true, user: { select: { isActive: true, notificationPreferences: true } } },
  });
  const userIds = [...new Set(registrations.filter((item) => item.user?.isActive && item.user.notificationPreferences?.inApp !== false && item.user.notificationPreferences?.communityUpdates !== false).map((item) => item.userId).filter(Boolean))];
  if (!userIds.length) return { count: 0 };
  return client.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...notification })),
  });
}
