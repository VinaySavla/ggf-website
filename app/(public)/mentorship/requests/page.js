import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MentorshipStatus from "@/components/public/MentorshipStatus";

export const dynamic = "force-dynamic";
export default async function MentorshipRequestsPage() {
  const session = await auth(); if (!session) redirect("/login?callbackUrl=/mentorship/requests");
  const personSelect = { firstName: true, surname: true, email: true, mobile: true };
  const requests = await prisma.mentorship.findMany({ where: { OR: [{ mentorId: session.user.id }, { menteeId: session.user.id }] }, include: { mentor: { select: personSelect }, mentee: { select: personSelect } }, orderBy: { createdAt: "desc" } });
  return <div className="py-12"><div className="container-custom max-w-3xl"><h1 className="text-3xl font-bold">My mentorship requests</h1><p className="text-gray-600 mt-2">Contact details appear only after a mentor accepts.</p><div className="border rounded-xl mt-7 divide-y">{requests.map((request) => { const incoming = request.mentorId === session.user.id; const person = incoming ? request.mentee : request.mentor; return <div key={request.id} className="p-5 flex justify-between gap-3"><div><p className="font-semibold">{request.topic}</p><p className="text-sm text-gray-500">{incoming ? "From" : "To"}: {person.firstName} {person.surname}</p>{request.message && <p className="text-sm mt-2">{request.message}</p>}{["accepted", "completed"].includes(request.status) && <p className="text-sm bg-green-50 rounded p-2 mt-3">Contact: {person.email || person.mobile || "Ask GGF support to connect you"}</p>}</div><MentorshipStatus id={request.id} incoming={incoming} status={request.status}/></div>; })}{!requests.length && <p className="p-10 text-center text-gray-500">No mentorship requests.</p>}</div></div></div>;
}
