import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import BusinessForm from "@/components/public/BusinessForm";

export const dynamic = "force-dynamic";
export default async function ManageBusinessPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/businesses/manage");
  const profile = await prisma.businessProfile.findUnique({ where: { userId: session.user.id } });
  return <div className="py-12"><div className="container-custom max-w-2xl"><h1 className="text-3xl font-bold">My business listing</h1><p className="text-gray-600 mt-2">Listings are reviewed before becoming public.</p>{profile && <div className={`rounded-lg p-4 my-5 ${profile.moderationStatus === "rejected" ? "bg-red-50 text-red-800" : profile.moderationStatus === "approved" ? "bg-green-50 text-green-800" : "bg-yellow-50 text-yellow-900"}`}><strong>Status: {profile.moderationStatus}</strong>{profile.moderationReason && <p className="text-sm mt-1">{profile.moderationReason}</p>}</div>}<BusinessForm profile={profile}/></div></div>;
}
