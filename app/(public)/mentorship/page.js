import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { MentorButton } from "@/components/public/CommunityForms";

export const dynamic = "force-dynamic";
export default async function MentorshipPage() {
  const session = await auth();
  const blockFilter = session ? { blocksCreated: { none: { blockedId: session.user.id } }, blocksReceived: { none: { blockerId: session.user.id } } } : {};
  const mentors = await prisma.user.findMany({ where: { isActive: true, isDirectoryVisible: true, isMentorAvailable: true, skills: { isEmpty: false }, ...blockFilter }, select: { id: true, firstName: true, middleName: true, surname: true, profession: true, skills: true, userProfile: { select: { bio: true } } }, orderBy: { firstName: "asc" }, take: 100 });
  return <div className="py-12"><div className="container-custom"><div className="flex flex-wrap justify-between gap-4"><div><h1 className="text-3xl font-bold">Mentorship</h1><p className="text-gray-600 mt-2">Mentors shown here have explicitly opted in to receive requests.</p></div>{session && <Link href="/mentorship/requests" className="border px-4 py-2 rounded-lg h-fit">My requests</Link>}</div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">{mentors.map((mentor) => <article key={mentor.id} className="border rounded-xl p-5"><Link href={`/user/${mentor.id}`} className="font-bold hover:text-primary">{mentor.firstName} {mentor.middleName} {mentor.surname}</Link><p className="text-sm text-primary">{mentor.profession || "GGF Member"}</p><p className="text-sm text-gray-600 mt-3">{mentor.userProfile?.bio}</p><div className="flex flex-wrap gap-1 mt-3">{mentor.skills.map((skill) => <span key={skill} className="bg-gray-100 text-xs px-2 py-1 rounded">{skill}</span>)}</div>{session && session.user.id !== mentor.id && <div className="mt-4"><MentorButton mentorId={mentor.id}/></div>}</article>)}</div></div></div>;
}
