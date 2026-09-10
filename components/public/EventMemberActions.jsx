"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Clock } from "lucide-react";
import { joinWaitlist, toggleBookmark } from "@/actions/member.actions";

export function BookmarkButton({ eventId, initial = false }) {
  const [saved, setSaved] = useState(initial);
  return <button onClick={async () => { const result = await toggleBookmark(eventId); if (result.error) toast.error(result.error); else { setSaved(result.bookmarked); toast.success(result.bookmarked ? "Event saved" : "Bookmark removed"); } }} className="inline-flex items-center gap-2 border rounded-lg px-4 py-2"><Bookmark className={`w-4 h-4 ${saved ? "fill-primary text-primary" : ""}`}/>{saved ? "Saved" : "Save event"}</button>;
}

export function WaitlistButton({ eventId }) {
  const [busy, setBusy] = useState(false);
  return <button disabled={busy} onClick={async () => { setBusy(true); const result = await joinWaitlist(eventId); setBusy(false); result.error ? toast.error(result.error) : toast.success(`Added to waitlist at position ${result.position}`); }} className="inline-flex items-center gap-2 bg-primary text-white rounded-lg px-5 py-3"><Clock className="w-4 h-4"/>{busy ? "Joining…" : "Join waitlist"}</button>;
}
