import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Award, Download } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function CertificatesPage() {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/certificates");
  const certificates = await prisma.certificate.findMany({ where: { userId: session.user.id }, include: { event: true }, orderBy: { issuedAt: "desc" } });
  return <div className="py-12"><div className="container-custom max-w-4xl"><h1 className="text-3xl font-bold">Certificates & achievements</h1><p className="text-gray-600 mt-2 mb-8">Your verified participation and recognition from GGF.</p><div className="grid md:grid-cols-2 gap-4">{certificates.map((item) => <div key={item.id} className="border rounded-xl p-5 flex gap-4"><Award className="text-primary w-10 h-10"/><div className="flex-1"><h2 className="font-bold">{item.title}</h2><p className="text-sm text-gray-500">{item.event?.title || "Godhra Graduates Forum"} · {formatDate(item.issuedAt)}</p><p className="font-mono text-xs mt-2">{item.certificateNumber}</p><Link href={`/verify/certificate/${item.certificateNumber}`} className="text-primary text-sm block mt-2">Public verification</Link>{item.fileUrl && <a href={item.fileUrl} className="text-primary text-sm inline-flex gap-1 mt-2"><Download className="w-4 h-4"/> View secure file</a>}</div></div>)}{!certificates.length && <p className="text-gray-500 bg-gray-50 rounded-xl p-10 text-center md:col-span-2">Certificates issued to you will appear here.</p>}</div></div></div>;
}
