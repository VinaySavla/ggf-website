"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateRefundStatus } from "@/actions/payment.actions";

export default function RefundActions({ id, status }) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  async function update(next) {
    setBusy(true); const result = await updateRefundStatus(id, next, reference); setBusy(false);
    result.error ? toast.error(result.error) : toast.success(`Refund ${next}`);
    if (!result.error) router.refresh();
  }
  if (["completed", "rejected"].includes(status)) return null;
  return <div className="flex flex-wrap gap-2 items-center">
    <input aria-label="Refund transaction reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference for completion" className="border rounded p-2 text-sm" />
    <button disabled={busy} onClick={() => update("approved")} className="text-blue-700">Approve</button>
    <button disabled={busy} onClick={() => update("completed")} className="text-green-700">Complete</button>
    <button disabled={busy} onClick={() => update("rejected")} className="text-red-700">Reject</button>
  </div>;
}
