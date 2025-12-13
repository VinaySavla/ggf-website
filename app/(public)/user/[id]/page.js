import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Public player profile page now redirects to admin user profile page (protected)
export default async function PlayerProfilePage({ params }) {
  const { id } = await params;
  const session = await auth();
  
  if (!session) {
    redirect(`/login?callbackUrl=/admin/user/${id}`);
  }
  
  redirect(`/admin/user/${id}`);
}
