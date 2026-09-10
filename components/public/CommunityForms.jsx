"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { applyToVolunteer, requestMentorship, submitOpportunity } from "@/actions/member.actions";

function Field({ name, label, ...props }) { return <div><label htmlFor={`opportunity-${name}`} className="block text-sm font-medium mb-1">{label}</label><input id={`opportunity-${name}`} name={name} className="border rounded-lg p-3 w-full" {...props}/></div>; }

export function OpportunityForm() {
  const router = useRouter(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  async function submit(event) { event.preventDefault(); setBusy(true); const result = await submitOpportunity(Object.fromEntries(new FormData(event.currentTarget))); setBusy(false); if (result.error) toast.error(result.error); else { toast.success("Submitted for review"); setOpen(false); router.refresh(); } }
  if (!open) return <button onClick={() => setOpen(true)} className="bg-primary text-white px-5 py-3 rounded-lg">Share an opportunity</button>;
  return <form onSubmit={submit} className="bg-gray-50 border rounded-xl p-5 grid gap-3 w-full"><Field name="title" label="Opportunity title" required/><div><label htmlFor="opportunity-type" className="block text-sm font-medium mb-1">Type</label><select id="opportunity-type" name="type" className="border rounded-lg p-3 w-full"><option>Job</option><option>Internship</option><option>Scholarship</option><option>Admission</option><option>Training</option></select></div><Field name="organization" label="Organization"/><Field name="location" label="Location"/><div><label htmlFor="opportunity-description" className="block text-sm font-medium mb-1">Description</label><textarea id="opportunity-description" name="description" required className="border rounded-lg p-3 w-full"/></div><Field name="applyUrl" label="Application link" type="url"/><Field name="contactEmail" label="Contact email" type="email"/><div className="flex gap-2"><button disabled={busy} className="bg-primary text-white px-5 py-2 rounded-lg">{busy ? "Submitting…" : "Submit"}</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></div></form>;
}

export function VolunteerButton({ opportunityId }) { const [busy, setBusy] = useState(false); return <button disabled={busy} onClick={async () => { setBusy(true); const result = await applyToVolunteer(opportunityId, ""); setBusy(false); result.error ? toast.error(result.error) : toast.success("Volunteer application sent"); }} className="text-primary font-medium">{busy ? "Applying…" : "Volunteer →"}</button>; }

export function MentorButton({ mentorId }) {
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="text-primary text-sm font-medium">Request mentorship</button>;
  return <form onSubmit={async (event) => { event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget); const result = await requestMentorship(mentorId, data.get("topic"), data.get("message")); setBusy(false); result.error ? toast.error(result.error) : (toast.success("Mentorship request sent"), setOpen(false)); }} className="mt-3 grid gap-2"><label htmlFor={`mentor-topic-${mentorId}`} className="text-sm font-medium">Topic</label><input id={`mentor-topic-${mentorId}`} name="topic" required className="border rounded p-2"/><label htmlFor={`mentor-message-${mentorId}`} className="text-sm font-medium">Short message</label><textarea id={`mentor-message-${mentorId}`} name="message" className="border rounded p-2"/><button disabled={busy} className="bg-primary text-white rounded p-2">Send request</button></form>;
}
