import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ImageIcon, Plus, FolderOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Gallery Management - GGF Admin",
};

async function getCollections() {
  return prisma.galleryCollection.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      _count: {
        select: { images: true },
      },
    },
  });
}

export default async function AdminGalleryPage() {
  const session = await auth();
  
  if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
    redirect("/admin");
  }

  const collections = await getCollections();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ImageIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
        </div>
        <Link
          href="/admin/gallery/collections/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
        >
          <Plus className="w-5 h-5" />
          New Collection
        </Link>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Collections Yet</h3>
          <p className="text-gray-500 mb-6">
            Create your first gallery collection to start organizing photos.
          </p>
          <Link
            href="/admin/gallery/collections/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
          >
            <Plus className="w-5 h-5" />
            Create First Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/admin/gallery/collections/${collection.id}`}
              className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
            >
              <div className="aspect-video relative bg-gray-100">
                {collection.coverImage ? (
                  <Image
                    src={collection.coverImage}
                    alt={collection.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    collection.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {collection.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {collection.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <ImageIcon className="w-4 h-4" />
                  <span>{collection._count.images} images</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
