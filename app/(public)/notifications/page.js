import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { MarkAllReadButton, ReadNotificationLink } from "@/components/public/NotificationActions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/notifications");
  const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="py-12"><div className="container-custom max-w-3xl"><div className="flex justify-between items-center"><div><h1 className="text-3xl font-bold">Notifications</h1><p className="text-gray-600 mt-1">Registration, payment and community updates.</p></div><MarkAllReadButton/></div><div className="mt-8 border rounded-xl overflow-hidden">{notifications.map((item) => <div key={item.id} className={`p-5 border-b last:border-0 ${item.isRead ? "bg-white" : "bg-primary-50"}`}><ReadNotificationLink notification={item}/><p className="text-sm text-gray-600 mt-1">{item.message}</p><p className="text-xs text-gray-400 mt-2">{formatDateTime(item.createdAt)}</p></div>)}{!notifications.length && <p className="p-10 text-center text-gray-500">No notifications yet.</p>}</div></div></div>;
}
