import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { isAdminRole } from "@/lib/roles";

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session || !isAdminRole(session.user.role)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar userRole={session.user.role} />
      <div className="lg:pl-64">
        <AdminHeader user={session.user} />
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
