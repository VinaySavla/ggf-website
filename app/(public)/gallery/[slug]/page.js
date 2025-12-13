import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import GalleryViewer from "@/components/public/GalleryViewer";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  
  if (!collection) {
    return { title: "Collection Not Found" };
  }

  return {
    title: `${collection.name} - Gallery - GGF Community Portal`,
    description: collection.description || `View photos from ${collection.name}`,
  };
}

async function getCollection(slug) {
  try {
    const collection = await prisma.galleryCollection.findUnique({
      where: { slug, isActive: true },
      include: {
        images: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
    return collection;
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    return null;
  }
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const collection = await getCollection(slug);

  if (!collection) {
    notFound();
  }

  return <GalleryViewer collection={collection} />;
}
