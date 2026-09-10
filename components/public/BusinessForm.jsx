"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveBusinessProfile } from "@/actions/member.actions";

const fields = [
  ["name", "Business or practice name", "text", true], ["category", "Category", "text", true],
  ["phone", "Phone", "tel", false], ["email", "Public contact email", "email", false],
  ["website", "Website", "url", false], ["address", "Address", "text", false],
];
export default function BusinessForm({ profile }) {
  const router = useRouter();
  return <form className="grid gap-4 mt-6" onSubmit={async (event) => { event.preventDefault(); const result = await saveBusinessProfile(Object.fromEntries(new FormData(event.currentTarget))); result.error ? toast.error(result.error) : (toast.success("Saved and submitted for approval"), router.refresh()); }}>
    {fields.map(([name, label, type, required]) => <div key={name}><label htmlFor={`business-${name}`} className="block text-sm font-medium mb-1">{label}{required ? " *" : ""}</label><input id={`business-${name}`} name={name} type={type} required={required} defaultValue={profile?.[name] || ""} className="border rounded-lg p-3 w-full"/></div>)}
    <div><label htmlFor="business-description" className="block text-sm font-medium mb-1">Description</label><textarea id="business-description" name="description" defaultValue={profile?.description || ""} className="border rounded-lg p-3 w-full"/></div>
    <button className="bg-primary text-white rounded-lg p-3">Save and submit for review</button>
  </form>;
}
