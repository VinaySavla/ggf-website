"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const navLinks = [["/", "Home"], ["/events", "Events"], ["/gallery", "Gallery"], ["/community", "Community"], ["/about", "About"]];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const memberLinks = session ? [
    ["/dashboard", "Dashboard"], [`/user/${session.user.id}`, "My complete profile"],
    ["/my-registrations", "My registrations"], ["/membership-card", "Membership card"],
    ["/certificates", "Certificates"], ["/notifications", "Notifications"], ["/profile", "Account settings"],
    ...(['ORGANIZER', 'FINANCE_REVIEWER', 'SUPER_ADMIN'].includes(session.user.role) ? [["/admin", "Admin dashboard"]] : []),
  ] : [];
  const active = (href) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 backdrop-blur-md print:hidden">
      <a href="#page-content" className="skip-link">Skip to content</a>
      <nav className="container-custom flex min-h-20 items-center justify-between gap-5" aria-label="Main navigation">
        <Link href="/" className="flex shrink-0 items-center gap-3"><Image src="/GGF.png" alt="" width={46} height={46}/><span className="text-sm font-semibold leading-5 text-primary-900">Godhra Graduates<span className="block font-normal text-gray-500">Forum</span></span></Link>
        <div className="hidden items-center gap-1 lg:flex">{navLinks.map(([href, label]) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active(href) ? "bg-primary-50 text-primary" : "text-gray-600 hover:bg-gray-50 hover:text-primary"}`}>{label}</Link>)}</div>
        <div className="hidden items-center gap-3 lg:flex">
          {session ? <DropdownMenu.Root><DropdownMenu.Trigger className="inline-flex max-w-56 items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-medium text-primary-900"><User className="h-4 w-4 shrink-0"/><span className="truncate">{session.user.firstName || session.user.name || "My account"}</span><ChevronDown className="h-4 w-4 shrink-0"/></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={10} className="z-[60] min-w-60 rounded-xl border bg-white p-2 shadow-xl">{memberLinks.map(([href, label]) => <DropdownMenu.Item key={href} asChild><Link href={href} className="block rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:bg-primary-50 focus:text-primary">{label}</Link></DropdownMenu.Item>)}<DropdownMenu.Separator className="my-2 h-px bg-gray-100"/><DropdownMenu.Item onSelect={() => signOut()} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-700 outline-none focus:bg-red-50"><LogOut className="h-4 w-4"/>Log out</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root> : status !== "loading" && <Link href="/login" className="btn-primary text-sm">Member login</Link>}
        </div>
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex h-11 w-11 items-center justify-center rounded-xl border text-primary-900 lg:hidden" aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isOpen} aria-controls="mobile-navigation">{isOpen ? <X/> : <Menu/>}</button>
      </nav>
      {isOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="max-h-[calc(100dvh-5rem)] overflow-y-auto border-t bg-white p-4 lg:hidden" onKeyDown={(event) => { if (event.key === "Escape") setIsOpen(false); }}><div className="container-custom grid gap-1">{navLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setIsOpen(false)} aria-current={active(href) ? "page" : undefined} className={`rounded-lg px-3 py-3 text-sm font-medium ${active(href) ? "bg-primary-50 text-primary" : "text-gray-700"}`}>{label}</Link>)}<div className="my-2 border-t"/>{session ? <>{memberLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-3 text-sm text-gray-700 hover:bg-primary-50">{label}</Link>)}<button onClick={() => { setIsOpen(false); signOut(); }} className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm text-red-700"><LogOut className="h-4 w-4"/>Log out</button></> : <Link href="/login" onClick={() => setIsOpen(false)} className="btn-primary text-center">Member login</Link>}</div></nav>}
    </header>
  );
}
