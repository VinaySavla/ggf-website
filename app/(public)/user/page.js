import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Public players page now redirects to admin user page (protected)
export default async function PlayersPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/login?callbackUrl=/admin/user");
  }
  
  redirect("/admin/user");
}
