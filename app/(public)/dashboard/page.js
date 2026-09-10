import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calendar, Bell, Award, Briefcase, Users, ArrowRight, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MemberDashboard() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/dashboard");
  const userId = session.user.id;
  const now = new Date();
  const [registrations, unreadCount, certificateCount, announcements, opportunityCount, bookmarks, upcomingCount] = await Promise.all([
    prisma.registration.findMany({ where: { OR: [{ userId }, { userData: { path: ["userId"], equals: userId } }] }, include: { event: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.certificate.count({ where: { userId } }),
    prisma.announcement.findMany({ where: { isActive: true, audience: { in: ["all", "members"] }, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] }, orderBy: { publishedAt: "desc" }, take: 3 }),
    prisma.opportunity.count({ where: { moderationStatus: "approved", OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] } }),
    prisma.eventBookmark.findMany({ where: { userId }, include: { event: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    prisma.registration.count({ where: { userId, status: "active", event: { eventDate: { gte: now } } } }),
  ]);

  return <div className="py-10 bg-gray-50 min-h-screen"><div className="container-custom space-y-8">
    <div className="home-hero rounded-2xl border border-primary/10 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6"><div><p className="eyebrow mb-3">Member dashboard</p><h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-primary-900">Welcome, {session.user.firstName}</h1><p className="text-gray-600 mt-3">Your registrations, updates and community activity in one place.</p></div><Link href={`/user/${userId}`} className="btn-secondary gap-2">My complete profile <ArrowRight className="w-4 h-4"/></Link></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        [Calendar, "Upcoming events", upcomingCount, "/my-registrations"],
        [Bell, "Unread updates", unreadCount, "/notifications"],
        [Award, "Certificates", certificateCount, "/certificates"],
        [Briefcase, "Open opportunities", opportunityCount, "/opportunities"],
      ].map(([Icon, label, value, href]) => <Link key={label} href={href} className="bg-white rounded-xl border p-5 hover:shadow-md transition"><Icon className="w-6 h-6 text-primary"/><p className="text-2xl font-bold mt-3">{value}</p><p className="text-sm text-gray-500">{label}</p></Link>)}
    </div>
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 bg-white rounded-xl border p-6"><div className="flex justify-between mb-5"><h2 className="font-bold text-xl">My registrations</h2><Link href="/my-registrations" className="text-primary text-sm">View all</Link></div>
        <div className="space-y-3">{registrations.length ? registrations.map((registration) => <Link href={`/my-registrations/${registration.id}`} key={registration.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-primary-50"><div><p className="font-semibold">{registration.event.title}</p><p className="text-sm text-gray-500">{registration.event.eventDate ? formatDate(registration.event.eventDate) : "Date to be announced"} · {registration.registrationNumber || "Legacy registration"}</p></div><span className={`text-xs px-3 py-1 rounded-full ${registration.paymentStatus === "paid" ? "bg-green-100 text-green-700" : registration.paymentStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{registration.paymentStatus}</span></Link>) : <p className="text-gray-500 py-8 text-center">You have not registered for an event yet.</p>}</div>
      </section>
      <section className="bg-white rounded-xl border p-6"><h2 className="font-bold text-xl mb-5">Announcements</h2><div className="space-y-4">{announcements.length ? announcements.map((item) => <div key={item.id} className="border-b pb-4 last:border-0"><p className="font-semibold">{item.title}</p><p className="text-sm text-gray-600 line-clamp-2">{item.content.replace(/<[^>]+>/g, "")}</p></div>) : <p className="text-gray-500">No announcements.</p>}</div></section>
    </div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Link href={`/user/${userId}`} className="bg-white border rounded-xl p-6"><Users className="text-primary"/><h3 className="font-bold text-lg mt-4">My complete profile</h3><p className="text-gray-500 text-sm">See combined sports stats, events, skills, certificates and contributions.</p></Link>
      <Link href="/membership-card" className="bg-primary text-white rounded-xl p-6"><Users/><h3 className="font-bold text-lg mt-4">Digital membership card</h3><p className="text-primary-100 text-sm">Open or print your verified GGF member identity.</p></Link>
      <Link href="/opportunities" className="bg-white border rounded-xl p-6"><Briefcase className="text-primary"/><h3 className="font-bold text-lg mt-4">Jobs & opportunities</h3><p className="text-gray-500 text-sm">Explore jobs, internships and scholarships.</p></Link>
      <Link href="/volunteer" className="bg-white border rounded-xl p-6"><Clock className="text-primary"/><h3 className="font-bold text-lg mt-4">Volunteer</h3><p className="text-gray-500 text-sm">Contribute to GGF initiatives.</p></Link>
    </div>
    <section className="bg-white rounded-xl border p-6"><div className="flex justify-between mb-4"><h2 className="font-bold text-xl">Saved events</h2><Link href="/events" className="text-primary text-sm">Find events</Link></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{bookmarks.map(({ event }) => <Link key={event.id} href={`/events/${event.slug}`} className="rounded-lg bg-gray-50 p-4 hover:bg-primary-50"><p className="font-semibold">{event.title}</p><p className="text-sm text-gray-500 mt-1">{event.eventDate ? formatDate(event.eventDate) : "Date to be announced"}</p></Link>)}{!bookmarks.length && <p className="text-gray-500">Bookmark an event to find it here.</p>}</div></section>
  </div></div>;
}
