import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RefundActions from "@/components/admin/RefundActions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export default async function RefundsPage() {
  const session = await auth();
  const scoped = session.user.role === "SUPER_ADMIN" ? {} : { registration: { event: { OR: [{ organizerId: session.user.id }, { tournament: { organizerId: session.user.id } }, { financeAssignments: { some: { reviewerId: session.user.id, isActive: true } } }] } } };
  const refunds = await prisma.refundRequest.findMany({ where: scoped, include: { registration: { include: { event: true, user: true } } }, orderBy: { requestedAt: "desc" }, take: 200 });
  return <div><h1 className="text-2xl font-bold">Refund queue</h1><p className="text-gray-600 mt-1">Track every paid cancellation through approval and manual refund completion.</p>
    <div className="mt-6 space-y-3">{refunds.map((refund) => <article key={refund.id} className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">{refund.registration.event.title}</h2><p className="text-sm text-gray-600">{refund.registration.user?.firstName} {refund.registration.user?.surname} · ₹{refund.amount ?? "—"} · requested {formatDateTime(refund.requestedAt)}</p><p className="text-sm mt-1">Status: <strong>{refund.status}</strong>{refund.reference ? ` · Reference: ${refund.reference}` : ""}</p></div><RefundActions id={refund.id} status={refund.status}/></div>
    </article>)}{refunds.length === 0 && <p className="bg-white rounded-xl p-8 text-gray-500">No refund requests.</p>}</div>
  </div>;
}
