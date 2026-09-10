/* eslint-disable @next/next/no-img-element -- QR is a per-request data URL. */
import Image from "next/image";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/verification-token";
import PrintButton from "@/components/public/PrintButton";

export const dynamic = "force-dynamic";
export default async function MembershipCardPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/membership-card");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { userProfile: true } });
  const token = createVerificationToken({ type: "member", userId: user.id });
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/verify/member?token=${encodeURIComponent(token)}`;
  const qr = await QRCode.toDataURL(verifyUrl, { width: 220, margin: 1 });
  return <div className="py-12 bg-gray-50 min-h-screen"><div className="container-custom max-w-xl"><div className="bg-gradient-to-br from-primary-700 to-primary rounded-2xl text-white p-7 shadow-xl"><div className="flex justify-between items-start"><div><p className="text-primary-100 text-sm">Godhra Graduates Forum</p><h1 className="text-2xl font-bold mt-1">Digital Membership Card</h1></div><Image src="/GGF.png" alt="GGF" width={58} height={58} className="bg-white rounded-full p-1"/></div><div className="flex gap-5 items-center mt-8">{user.photo && <Image src={user.photo} alt="" width={96} height={112} className="rounded-xl object-cover border-2 border-white"/>}<div><p className="text-xl font-bold">{user.firstName} {user.middleName} {user.surname}</p><p className="text-primary-100">{user.village}</p><p className="font-mono mt-3">{user.userProfile?.playerId}</p><span className="inline-block bg-green-400 text-green-950 px-2 py-1 rounded text-xs mt-2">{user.isActive ? "Active member" : "Inactive"}</span></div></div><div className="bg-white rounded-xl p-3 w-fit mx-auto mt-7"><img src={qr} alt="Secure membership verification QR" className="w-36 h-36"/></div><p className="text-center text-xs text-primary-100 mt-2">Scan to verify on the official portal</p></div><div className="mt-5 text-center print:hidden"><PrintButton/></div></div></div>;
}
