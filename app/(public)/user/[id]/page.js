import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeSportStats } from "@/lib/member-profile";
import { formatDate } from "@/lib/utils";
import MemberSafetyActions from "@/components/public/MemberSafetyActions";

export const dynamic = "force-dynamic";

export default async function UnifiedMemberProfile({ params }) {
  const { id } = await params;
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      userProfile: { include: { statsRecords: { include: { sport: true, tournament: { include: { event: true } } }, orderBy: { createdAt: "desc" } }, tournamentRosters: { include: { team: true, tournament: { include: { event: true } } } } } },
      registrations: { where: { status: "active" }, include: { event: { include: { sports: { include: { sport: true } } } } }, orderBy: { createdAt: "desc" } },
      attendances: { include: { event: true }, orderBy: { checkedInAt: "desc" } },
      certificates: { include: { event: true }, orderBy: { issuedAt: "desc" } },
      volunteerApplications: { include: { opportunity: true }, orderBy: { createdAt: "desc" } },
      mentorshipsAsMentor: true,
      mentorshipsAsMentee: true,
    },
  });
  if (!user || !user.isActive) notFound();
  const isOwner = session?.user?.id === user.id;
  if (!user.isDirectoryVisible && !isOwner && session?.user?.role !== "SUPER_ADMIN") notFound();
  const relationshipBlock = session && !isOwner ? await prisma.memberBlock.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: session.user.id }, { blockerId: session.user.id, blockedId: user.id }] } }) : null;
  if (relationshipBlock?.blockerId === user.id) notFound();

  const sportStats = mergeSportStats(user.userProfile?.statsRecords || []);
  const attendedIds = new Set(user.attendances.map((item) => item.eventId));
  const completedVolunteering = user.volunteerApplications.filter((item) => item.status === "completed");
  const volunteerHours = completedVolunteering.reduce((sum, item) => sum + Number(item.hoursLogged || 0), 0);
  const sportEvents = new Map();
  for (const registration of user.registrations) for (const item of registration.event.sports) {
    const entry = sportEvents.get(item.sportId) || { name: item.sport.name, events: new Set() };
    entry.events.add(registration.event.title); sportEvents.set(item.sportId, entry);
  }
  for (const roster of user.userProfile?.tournamentRosters || []) {
    const key = roster.tournament.sportId || `tournament-${roster.tournamentId}`;
    const entry = sportEvents.get(key) || { name: roster.tournament.event.title, events: new Set() };
    entry.events.add(roster.tournament.event.title); sportEvents.set(key, entry);
  }

  return <main className="py-12 bg-gray-50 min-h-screen"><div className="container-custom max-w-6xl space-y-6">
    <header className="bg-white border rounded-2xl p-6 flex flex-col sm:flex-row gap-5">
      {user.photo ? <Image src={user.photo} alt={`${user.firstName} ${user.surname}`} width={112} height={112} className="rounded-2xl object-cover w-28 h-28"/> : <div className="w-28 h-28 rounded-2xl bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary">{user.firstName[0]}</div>}
      <div className="flex-1"><p className="text-sm text-primary font-mono">{user.userProfile?.playerId || "GGF member"}</p><h1 className="text-3xl font-bold">{user.firstName} {user.middleName} {user.surname}</h1><p className="text-gray-600 mt-1">{user.profession || user.education || "GGF Member"}{user.village ? ` · ${user.village}` : ""}</p><p className="mt-3 text-gray-700">{user.userProfile?.bio}</p><div className="flex flex-wrap gap-2 mt-4">{user.skills.map((skill) => <span key={skill} className="bg-primary-50 text-primary-800 px-3 py-1 rounded-full text-sm">{skill}</span>)}</div></div>
      {isOwner ? <Link href="/profile" className="border rounded-lg px-4 py-2 h-fit">Edit profile</Link> : session && <MemberSafetyActions memberId={user.id} initiallyBlocked={relationshipBlock?.blockerId === session.user.id}/>}
    </header>

    <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Member totals">
      {[["Events joined", user.registrations.length], ["Events attended", attendedIds.size], ["Certificates", user.certificates.length], ["Volunteer hours", volunteerHours]].map(([label, value]) => <div key={label} className="bg-white border rounded-xl p-5"><p className="text-3xl font-bold text-primary">{value}</p><p className="text-gray-600">{label}</p></div>)}
    </section>

    <section className="bg-white border rounded-2xl p-6"><h2 className="text-xl font-bold">Sports record</h2><p className="text-sm text-gray-600 mt-1">Career totals are merged from event records; every source event remains visible below.</p>
      <div className="grid lg:grid-cols-2 gap-5 mt-5">{sportStats.map((sport) => <article key={sport.id} className="border rounded-xl p-5"><h3 className="font-bold text-lg">{sport.name}</h3><div className="flex flex-wrap gap-3 mt-3">{Object.entries(sport.totals).map(([key, value]) => <span key={key} className="bg-gray-50 rounded-lg px-3 py-2"><strong>{value}</strong> <span className="text-sm text-gray-500">{key.replaceAll("_", " ")}</span></span>)}</div><details className="mt-4"><summary className="cursor-pointer text-primary">View {sport.events.length} event record(s)</summary><div className="mt-3 space-y-2">{sport.events.map((event) => <div key={event.id} className="bg-gray-50 rounded-lg p-3"><p className="font-medium">{event.label}</p><p className="text-sm text-gray-600">{Object.entries(event.stats).map(([key, value]) => `${key.replaceAll("_", " ")}: ${value}`).join(" · ") || "No numeric stats recorded"}</p></div>)}</div></details></article>)}
        {sportStats.length === 0 && <p className="text-gray-500">Event organizers have not recorded sports statistics yet.</p>}
      </div>
      {[...sportEvents.values()].length > 0 && <div className="mt-5"><h3 className="font-semibold">Sports participation</h3><div className="flex flex-wrap gap-2 mt-2">{[...sportEvents.values()].map((item) => <span key={item.name} className="border rounded-lg px-3 py-2">{item.name}: {item.events.size} event(s)</span>)}</div></div>}
    </section>

    <div className="grid lg:grid-cols-2 gap-6">
      <section className="bg-white border rounded-2xl p-6"><h2 className="text-xl font-bold">Event history</h2><div className="mt-4 space-y-3">{user.registrations.map((item) => <Link key={item.id} href={`/events/${item.event.slug}`} className="block border-b pb-3 last:border-0"><p className="font-semibold">{item.event.title}</p><p className="text-sm text-gray-500">{item.event.eventDate ? formatDate(item.event.eventDate) : "Date not announced"} · {attendedIds.has(item.eventId) ? "Attended" : "Registered"}</p></Link>)}{!user.registrations.length && <p className="text-gray-500">No event participation yet.</p>}</div></section>
      <section className="bg-white border rounded-2xl p-6"><h2 className="text-xl font-bold">Community contribution</h2><p className="mt-4"><strong>{completedVolunteering.length}</strong> volunteer assignments completed · <strong>{volunteerHours}</strong> hours logged</p><p className="mt-2"><strong>{user.mentorshipsAsMentor.filter((item) => ["accepted", "completed"].includes(item.status)).length}</strong> mentorships given · <strong>{user.mentorshipsAsMentee.filter((item) => ["accepted", "completed"].includes(item.status)).length}</strong> received</p><div className="mt-4 flex flex-wrap gap-2">{user.interests.map((interest) => <span key={interest} className="bg-gray-100 px-3 py-1 rounded-full text-sm">{interest}</span>)}</div></section>
    </div>
    <section className="bg-white border rounded-2xl p-6"><h2 className="text-xl font-bold">Certificates & recognition</h2><div className="grid sm:grid-cols-2 gap-3 mt-4">{user.certificates.map((item) => <div key={item.id} className="border rounded-lg p-4"><p className="font-semibold">{item.title}</p><p className="text-sm text-gray-500">{item.event?.title || "GGF"} · {formatDate(item.issuedAt)}</p><Link className="text-sm text-primary" href={`/verify/certificate/${item.certificateNumber}`}>Verify certificate</Link></div>)}{!user.certificates.length && <p className="text-gray-500">No certificates issued yet.</p>}</div></section>
  </div></main>;
}
