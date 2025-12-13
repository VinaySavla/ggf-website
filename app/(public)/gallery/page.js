import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Camera, FolderOpen, Images } from "lucide-react";

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
          take: 4, // Get first 4 images for preview
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/gallery/${collection.slug}`}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Folder Preview - Stack of images */}
                  <div className="relative aspect-[4/3] bg-gray-100">
                    {collection.images.length > 0 ? (
                      <>
                        {/* Background images for stack effect */}
                        {collection.images.length > 2 && (
                          <div className="absolute inset-0 transform translate-x-2 translate-y-2 rounded-lg overflow-hidden opacity-30">
                            <Image
                              src={collection.images[2]?.imageUrl || collection.images[0].imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        {collection.images.length > 1 && (
                          <div className="absolute inset-0 transform translate-x-1 translate-y-1 rounded-lg overflow-hidden opacity-60">
                            <Image
                              src={collection.images[1]?.imageUrl || collection.images[0].imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        {/* Main preview image */}
                        <div className="absolute inset-0 rounded-lg overflow-hidden">
                          <Image
                            src={collection.coverImage || collection.images[0].imageUrl}
                            alt={collection.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FolderOpen className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Photo count badge */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full">
                      <span className="text-white text-sm font-medium flex items-center gap-1">
                        <Images className="w-4 h-4" />
                        {collection._count.images}
                      </span>
                    </div>
                  </div>

                  {/* Collection Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
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
