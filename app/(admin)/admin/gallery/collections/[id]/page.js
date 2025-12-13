import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CollectionManager from "@/components/admin/CollectionManager";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const collection = await prisma.galleryCollection.findUnique({
    where: { id },
    select: { name: true },
  });
  
  return {
    title: collection ? `${collection.name} - Gallery Management` : "Collection Not Found",
  };
}

async function getCollection(id) {
  return prisma.galleryCollection.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      },
    },
  });
}

export default async function CollectionDetailPage({ params }) {
  const session = await auth();
  
  if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
    redirect("/admin");
  }

  const { id } = await params;
  const collection = await getCollection(id);

  if (!collection) {
    notFound();
  }

  return <CollectionManager collection={collection} userRole={session.user.role} />;
}
