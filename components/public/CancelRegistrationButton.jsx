"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cancelRegistration } from "@/actions/member.actions";

export default function CancelRegistrationButton({ registrationId, isPaid }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function cancel() {
    const warning = isPaid
      ? "Cancel this registration? Payment refunds are handled manually under the event refund policy."
      : "Cancel this registration? This will release your place.";
    if (!window.confirm(warning)) return;
    setLoading(true);
    const result = await cancelRegistration(registrationId);
    setLoading(false);
    if (result.error) return toast.error(result.error);
    toast.success("Registration cancelled");
    router.refresh();
  }

  return <button type="button" onClick={cancel} disabled={loading} className="px-4 py-2 border border-red-200 text-red-700 rounded-lg disabled:opacity-50">{loading ? "Cancelling…" : "Cancel registration"}</button>;
}
