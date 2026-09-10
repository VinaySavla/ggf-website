import Link from "next/link";
import { ArrowRight, Award, BriefcaseBusiness, CalendarCheck, HeartHandshake, ShieldCheck, Trophy } from "lucide-react";

const benefits = [
  [CalendarCheck, "01", "Show up for something", "Find your next event. Keep registrations, payment updates, and tickets together.", "/events", "Discover events"],
  [HeartHandshake, "02", "Make a difference", "Give your time, share your experience, and build a record of volunteering and mentorship.", "/volunteer", "Get involved"],
  [BriefcaseBusiness, "03", "Grow your circle", "Meet fellow graduates, find mentors, and explore opportunities in your community.", "/directory", "Meet the community"],
];

export default function PortalBenefits() {
  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="portal-benefits-title">
      <div className="container-custom">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end">
          <div><p className="eyebrow mb-4">Participation becomes your story</p><h2 id="portal-benefits-title" className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-primary-900 sm:text-4xl lg:text-5xl">Your complete GGF journey,<br/><span className="text-primary">in one profile.</span></h2></div>
          <p className="max-w-lg text-base leading-8 text-gray-600 lg:justify-self-end">From your first event to your latest achievement, bring the things you do and the people you connect with into one place.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <article className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-[#f5effa] p-6 sm:p-9 lg:col-span-3">
            <div className="flex items-center gap-3 text-sm font-semibold text-primary"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white"><Trophy className="h-5 w-5" aria-hidden="true"/></span>Your record, connected</div>
            <h3 className="mt-5 text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">Every event has a place.<br/>Every achievement adds up.</h3>
            <p className="mt-4 max-w-md text-sm leading-7 text-gray-600">Explore sport-by-sport career totals, open individual event records, and keep certificates and community contributions close at hand.</p>
            <div className="mt-8 rounded-2xl border border-white bg-white/85 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Inside your member profile</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">{[[Trophy, "Sports record", "Career totals + event details"], [Award, "Recognition", "Certificates + verification"], [HeartHandshake, "Contribution", "Volunteering + mentorship"], [BriefcaseBusiness, "About you", "Skills + interests"]].map(([Icon, title, detail]) => <div key={title} className="flex gap-3 rounded-xl border border-gray-100 p-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true"/><div><p className="text-sm font-semibold text-primary-900">{title}</p><p className="mt-1 text-xs leading-5 text-gray-600">{detail}</p></div></div>)}</div>
            </div>
            <Link href="/dashboard" className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary hover:underline underline-offset-4">Open your member dashboard <ArrowRight className="h-4 w-4" aria-hidden="true"/></Link>
          </article>

          <div className="grid gap-4 lg:col-span-2">{benefits.map(([Icon, number, title, description, href, label]) => <article key={number} className="group rounded-2xl border border-gray-200 bg-white p-6 transition-colors hover:border-primary/30"><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-primary" aria-hidden="true"/><span className="text-xs font-medium tracking-widest text-gray-400" aria-hidden="true">{number}</span></div><h3 className="mt-4 text-lg font-semibold text-primary-900">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{description}</p><Link href={href} className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline underline-offset-4">{label}<ArrowRight className="h-4 w-4" aria-hidden="true"/></Link></article>)}</div>
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true"/><div><p className="text-sm font-semibold text-primary-900">Your profile. Your choice.</p><p className="mt-1 text-sm leading-6 text-gray-600">Choose whether to appear in the member directory. Private documents stay access-controlled.</p></div></div><Link href="/policies/privacy" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-medium text-primary hover:underline">Our privacy promise <ArrowRight className="h-4 w-4" aria-hidden="true"/></Link></div>
      </div>
    </section>
  );
}
