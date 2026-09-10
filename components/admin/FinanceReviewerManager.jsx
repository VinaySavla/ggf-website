"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignFinanceReviewer, removeFinanceReviewer } from "@/actions/payment.actions";

export default function FinanceReviewerManager({ eventId, members, assignments }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function add(formData) {
    setBusy(true);
    const result = await assignFinanceReviewer(eventId, formData);
    setBusy(false);
    result.error ? toast.error(result.error) : toast.success("Finance reviewer assigned");
    if (!result.error) router.refresh();
  }
  async function remove(reviewerId) {
    setBusy(true);
    const result = await removeFinanceReviewer(eventId, reviewerId);
    setBusy(false);
    result.error ? toast.error(result.error) : toast.success("Finance access removed");
    if (!result.error) router.refresh();
  }
  return <section className="bg-white rounded-xl shadow-sm p-6 mt-6" aria-labelledby="finance-reviewers-title">
    <h2 id="finance-reviewers-title" className="text-lg font-bold">Payment reviewers</h2>
    <p className="text-sm text-gray-600 mt-1">Event-scoped finance reviewers can approve or reject payment proofs for this event only. They cannot edit the event.</p>
    <form action={add} className="flex flex-col sm:flex-row gap-3 mt-4">
      <label className="sr-only" htmlFor="finance-reviewer">Member</label>
      <select id="finance-reviewer" name="reviewerId" required className="border rounded-lg p-3 flex-1">
        <option value="">Select an active member</option>
        {members.map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.surname} — {member.email || member.mobile}</option>)}
      </select>
      <button disabled={busy} className="bg-primary text-white rounded-lg px-5 py-3 disabled:opacity-50">Assign reviewer</button>
    </form>
    <div className="mt-4 space-y-2">
      {assignments.length === 0 && <p className="text-sm text-gray-500">No additional finance reviewers assigned.</p>}
      {assignments.map(({ reviewer }) => <div key={reviewer.id} className="flex items-center justify-between border rounded-lg p-3">
        <span>{reviewer.firstName} {reviewer.surname} <span className="text-gray-500">({reviewer.email || reviewer.mobile})</span></span>
        <button type="button" disabled={busy} onClick={() => remove(reviewer.id)} className="text-red-700 hover:underline">Remove</button>
      </div>)}
    </div>
  </section>;
}
