import { Users, Calendar, Trophy, Award } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function StatsSection() {
  const [players, events, tournaments, certificates] = await Promise.all([
    prisma.masterPlayer.count(), prisma.event.count(), prisma.tournamentMaster.count(), prisma.certificate.count(),
  ]);
  const stats = [
    { icon: Users, value: players.toLocaleString("en-IN"), label: "Registered Members" },
    { icon: Calendar, value: events.toLocaleString("en-IN"), label: "Events Organized" },
    { icon: Trophy, value: tournaments.toLocaleString("en-IN"), label: "Tournaments" },
    { icon: Award, value: certificates.toLocaleString("en-IN"), label: "Certificates Issued" },
  ];

  return (
    <section className="bg-white pb-16 lg:pb-24" aria-labelledby="community-numbers-title">
      <div className="container-custom">
        <div className="rounded-[2rem] border border-primary/10 bg-[#faf8fc] p-6 sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="eyebrow mb-3">Made possible by our members</p><h2 id="community-numbers-title" className="text-3xl font-semibold tracking-tight text-primary-900 sm:text-4xl">A growing community.<br/>A shared sense of purpose.</h2></div><p className="max-w-sm text-sm leading-7 text-gray-600">Members, events, and achievements recorded on the GGF portal. Every number is part of our story.</p></div>
        <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-2xl border border-primary/10 bg-white p-4 sm:p-6">
              <dt className="text-xs leading-5 text-gray-600 sm:text-sm"><stat.icon className="mb-5 h-5 w-5 text-primary" aria-hidden="true"/>{stat.label}</dt>
              <dd className="mt-2 text-4xl font-semibold tracking-tight text-primary-900 sm:text-5xl">{stat.value}</dd>
            </div>
          ))}
        </dl>
        </div>
        <div className="mt-6 flex flex-col gap-6 rounded-[2rem] bg-primary-900 p-7 text-white sm:p-10 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary-200">Your next chapter starts here</p><h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Be part of what comes next.</h3><p className="mt-3 max-w-xl text-sm leading-7 text-primary-100">Find an event, meet your community, and start building your own GGF story.</p></div><div className="flex shrink-0 flex-col gap-3 sm:flex-row"><Link href="/register" className="inline-flex items-center justify-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-primary-900 hover:bg-primary-50">Create your member profile<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link><Link href="/directory" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3.5 text-sm font-semibold hover:bg-white/10">Explore the community</Link></div></div>
      </div>
    </section>
  );
}
