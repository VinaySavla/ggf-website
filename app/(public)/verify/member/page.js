import { prisma } from "@/lib/prisma";
import { readVerificationToken } from "@/lib/verification-token";

export const dynamic = "force-dynamic";
export default async function VerifyMemberPage({ searchParams }) {
  const token = readVerificationToken((await searchParams).token);
  const user = token?.type === "member" ? await prisma.user.findUnique({ where: { id: token.userId }, include: { userProfile: true } }) : null;
  const valid = Boolean(user?.isActive);
  return <main className="py-20"><div className={`max-w-xl mx-auto border rounded-2xl p-8 text-center ${valid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}><h1 className="text-3xl font-bold">{valid ? "Verified GGF member" : "Invalid membership code"}</h1>{valid && <><p className="text-xl mt-4">{user.firstName} {user.middleName} {user.surname}</p><p className="font-mono mt-2">{user.userProfile?.playerId}</p><p className="text-green-800 mt-4">Account is active. The signed code was issued by this portal.</p></>}</div></main>;
}
