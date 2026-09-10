import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyRegistrationsPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/my-registrations");
  const registrations = await prisma.registration.findMany({
    where: { OR: [{ userId: session.user.id }, { userData: { path: ["userId"], equals: session.user.id } }] },
    include: { event: true }, orderBy: { createdAt: "desc" },
  });
  return <div className="py-12"><div className="container-custom max-w-5xl"><h1 className="text-3xl font-bold">My registrations</h1><p className="text-gray-600 mt-2 mb-8">Track confirmation, manual payment review, tickets and attendance.</p>
    <div className="space-y-4">{registrations.map((item) => <Link key={item.id} href={`/my-registrations/${item.id}`} className="block border rounded-xl p-5 hover:shadow-md transition"><div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-bold text-lg">{item.event.title}</h2><p className="text-sm text-gray-500">{item.event.eventDate ? formatDate(item.event.eventDate) : "Date to be announced"}</p><p className="font-mono text-xs text-gray-500 mt-2">{item.registrationNumber || item.id}</p></div><div className="text-right"><span className={`inline-block px-3 py-1 rounded-full text-xs ${item.paymentStatus === "paid" ? "bg-green-100 text-green-700" : item.paymentStatus === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>{item.event.isPaid ? `Payment ${item.paymentStatus}` : "Confirmed"}</span>{item.rejectionReason && <p className="text-sm text-red-600 mt-2">Action required: {item.rejectionReason}</p>}</div></div></Link>)}{!registrations.length && <div className="text-center bg-gray-50 rounded-xl p-12"><p className="text-gray-600">No registrations yet.</p><Link href="/events" className="text-primary font-medium">Browse events</Link></div>}</div>
  </div></div>;
}
