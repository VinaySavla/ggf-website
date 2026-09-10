import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function VerifyCertificatePage({ params }) {
  const { number } = await params;
  const certificate = await prisma.certificate.findUnique({ where: { certificateNumber: number }, include: { user: true, event: true } });
  if (!certificate) notFound();
  return <main className="py-20"><div className="max-w-2xl mx-auto border border-green-300 bg-green-50 rounded-2xl p-8 text-center"><p className="text-green-800 font-semibold">Verified GGF certificate</p><h1 className="text-3xl font-bold mt-3">{certificate.title}</h1><p className="text-xl mt-4">Issued to {certificate.user.firstName} {certificate.user.middleName} {certificate.user.surname}</p><p className="mt-2">{certificate.event?.title || "Godhra Graduates Forum"} · {formatDate(certificate.issuedAt)}</p><p className="font-mono text-sm mt-5">{certificate.certificateNumber}</p></div></main>;
}
