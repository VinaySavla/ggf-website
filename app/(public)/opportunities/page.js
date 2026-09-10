import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OpportunityForm } from "@/components/public/CommunityForms";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function OpportunitiesPage({ searchParams }) {
  const params = await searchParams;
  const type = params.type || "all";
  const page = Math.max(1, Number(params.page) || 1);
  const mine = params.mine === "1";
  const session = await auth();
  const where = mine && session ? { creatorId: session.user.id } : { moderationStatus: "approved", ...(type !== "all" ? { type } : {}), OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] };
  const [items, total] = await Promise.all([prisma.opportunity.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * 20, take: 20 }), prisma.opportunity.count({ where })]);
  return <div className="py-12"><div className="container-custom max-w-5xl"><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-3xl font-bold">{mine ? "My opportunity submissions" : "Jobs & opportunities"}</h1><p className="text-gray-600 mt-2">{mine ? "Track review status and feedback." : "Community-shared careers, scholarships and learning opportunities."}</p></div>{session && <div className="flex gap-2"><Link href={mine ? "/opportunities" : "/opportunities?mine=1"} className="border rounded-lg px-4 py-3">{mine ? "Public opportunities" : "My submissions"}</Link><OpportunityForm/></div>}</div>
    {!mine && <div className="flex gap-2 mt-7 overflow-auto">{["all", "Job", "Internship", "Scholarship", "Admission", "Training"].map((value) => <Link key={value} href={value === "all" ? "/opportunities" : `/opportunities?type=${value}`} className={`px-4 py-2 rounded-full text-sm ${type === value ? "bg-primary text-white" : "bg-gray-100"}`}>{value}</Link>)}</div>}
    <div className="grid md:grid-cols-2 gap-4 mt-7">{items.map((item) => <article key={item.id} className="border rounded-xl p-5"><div className="flex justify-between gap-2"><span className="text-xs bg-primary-50 text-primary px-2 py-1 rounded">{item.type}</span>{mine && <span className={`text-xs px-2 py-1 rounded ${item.moderationStatus === "approved" ? "bg-green-100 text-green-800" : item.moderationStatus === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-900"}`}>{item.moderationStatus}</span>}</div><h2 className="text-xl font-bold mt-3">{item.title}</h2><p className="text-sm text-gray-500">{item.organization}{item.location ? ` · ${item.location}` : ""}</p><p className="text-gray-600 mt-3 line-clamp-3">{item.description}</p>{item.moderationReason && <p className="bg-red-50 text-red-800 text-sm rounded p-3 mt-3">{item.moderationReason}</p>}{item.expiresAt && <p className="text-xs text-gray-500 mt-3">Closes {formatDate(item.expiresAt)}</p>}{item.applyUrl && !mine && <a href={item.applyUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium inline-block mt-4">Apply now →</a>}</article>)}{!items.length && <p className="text-gray-500 py-10">No opportunities found.</p>}</div>
    {total > 20 && <nav aria-label="Opportunity pages" className="flex justify-between mt-6"><Link className={page === 1 ? "invisible" : "text-primary"} href={{ pathname: "/opportunities", query: { type, ...(mine ? { mine: 1 } : {}), page: page - 1 } }}>← Previous</Link><span>Page {page} of {Math.ceil(total / 20)}</span><Link className={page * 20 >= total ? "invisible" : "text-primary"} href={{ pathname: "/opportunities", query: { type, ...(mine ? { mine: 1 } : {}), page: page + 1 } }}>Next →</Link></nav>}
  </div></div>;
}
