import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrganizerForm from "@/components/admin/OrganizerForm";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Add Organizer - GGF Admin",
};

export default async function NewUserPage() {
  const session = await auth();

  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Organizer</h1>
        <p className="text-gray-600">Create a new organizer account</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <OrganizerForm />
      </div>
    </div>
  );
}
