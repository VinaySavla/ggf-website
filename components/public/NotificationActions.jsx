"use client";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead, markNotificationRead } from "@/actions/member.actions";

export function ReadNotificationLink({ notification }) {
  const router = useRouter();
  return <button onClick={async () => { await markNotificationRead(notification.id); if (notification.href) router.push(notification.href); else router.refresh(); }} className="text-left w-full">{notification.title}</button>;
}

export function MarkAllReadButton() {
  const router = useRouter();
  return <button onClick={async () => { await markAllNotificationsRead(); router.refresh(); }} className="text-sm text-primary font-medium">Mark all as read</button>;
}
