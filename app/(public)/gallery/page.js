import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Camera, Images } from "lucide-react";

// Force dynamic rendering since we fetch from database
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Gallery - GGF Community Portal",
  description: "View photos from GGF events and activities.",
};

async function getGalleryCollections() {
  try {
    const collections = await prisma.galleryCollection.findMany({
      where: { isActive: true },
      include: {
        images: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return collections;
  } catch (error) {
    console.error("Failed to fetch gallery collections:", error);
    return [];
  }
}

export default async function GalleryPage() {
  const collections = await getGalleryCollections();

  return (
    <div className="py-12">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Memories from our events, tournaments, and community gatherings.
          </p>
        </div>

        {collections.length > 0 ? (
          <div className="space-y-16">
            {collections.map((collection) => (
              <section key={collection.id}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{collection.name}</h2>
                    {collection.description && (
                      <p className="text-gray-500 mt-1">{collection.description}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {collection._count.images} photos
                  </span>
                </div>

                {collection.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {collection.images.map((image) => (
                      <div
                        key={image.id}
                        className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.title || 'Gallery image'}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300" />
                        {image.title && (
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <p className="text-white text-sm font-medium">{image.title}</p>
                            {image.description && (
                              <p className="text-white/70 text-xs mt-1">{image.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <Images className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No photos in this collection yet.</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-12 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No gallery images yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back after our upcoming events!</p>
          </div>
        )}
      </div>
    </div>
  );
}
