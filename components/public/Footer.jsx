import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Mail, MapPin } from "lucide-react";

const groups = [
  ["Explore", [["/", "Home"], ["/events", "Events"], ["/gallery", "Gallery"], ["/about", "About GGF"]]],
  ["Get connected", [["/community", "Community"], ["/directory", "Member directory"], ["/mentorship", "Mentorship"], ["/volunteer", "Volunteer"]]],
  ["Here to help", [["/governance", "Governance"], ["/contact", "Contact & grievances"], ["/policies/payments", "Payments & refunds"], ["/login", "Member login"]]],
];

export default function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-[#faf8fc] text-gray-600">
      <div className="container-custom">
        <div className="grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16 lg:py-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3"><Image src="/GGF.png" alt="" width={52} height={52}/><span className="text-base font-semibold leading-6 text-primary-900">Godhra Graduates<span className="block">Forum</span></span></Link>
            <p className="mt-5 max-w-sm text-sm leading-7">Connected by our roots.<br/>Growing through education, sports, and service.</p>
            <p className="mt-5 flex items-center gap-2 text-xs font-medium text-primary"><MapPin className="h-4 w-4" aria-hidden="true"/>Godhra & beyond</p>
            <a href="mailto:godharagraduatesforum@gmail.com" className="mt-3 inline-flex min-h-11 max-w-full items-center gap-2 text-sm hover:text-primary"><Mail className="h-4 w-4 shrink-0" aria-hidden="true"/><span className="break-all">godharagraduatesforum@gmail.com</span></a>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">{groups.map(([title, links]) => <nav key={title} aria-label={title}><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary-900">{title}</h2><ul>{links.map(([href, label]) => <li key={href}><Link href={href} className="inline-flex min-h-11 items-center text-sm transition-colors hover:text-primary hover:underline underline-offset-4">{label}</Link></li>)}</ul></nav>)}</div>
        </div>
        <div className="flex flex-col gap-5 border-y border-primary/10 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Image src="/GCS.png" alt="Godhra Sports Club logo" width={36} height={36} className="object-contain"/><p className="text-xs leading-5">In collaboration with<br/><span className="font-semibold text-primary-900">Godhra Sports Club</span></p></div><Link href="/contact" className="inline-flex min-h-11 items-center gap-3 text-sm font-medium text-primary">Let’s build something together <ArrowRight className="h-4 w-4" aria-hidden="true"/></Link></div>
        <div className="flex flex-col gap-3 py-6 text-xs sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Godhra Graduates Forum. All rights reserved.</p><div className="flex gap-6"><Link href="/policies/privacy" className="py-2 hover:text-primary hover:underline">Privacy policy</Link><Link href="/policies/terms" className="py-2 hover:text-primary hover:underline">Terms of use</Link></div></div>
      </div>
    </footer>
  );
}
