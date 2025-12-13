"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { generateSlug } from "@/lib/utils";

// ==================== COLLECTIONS ====================

export async function getCollections() {
  try {
    const collections = await prisma.galleryCollection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        _count: {
          select: { images: true },
        },
      },
    });
    return { collections };
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return { error: "Failed to fetch collections" };
  }
}

export async function getCollection(slug) {
  try {
    const collection = await prisma.galleryCollection.findUnique({
      where: { slug },
      include: {
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        },
      },
    });
    return { collection };
  } catch (error) {
    console.error("Failed to fetch collection:", error);
    return { error: "Failed to fetch collection" };
  }
}

export async function createCollection(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { name, description, coverImage } = data;

    // Generate unique slug
    let slug = generateSlug(name);
    const existing = await prisma.galleryCollection.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now()}`;
    }

    const collection = await prisma.galleryCollection.create({
      data: {
        name,
        slug,
        description,
        coverImage,
      },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { collection };
  } catch (error) {
    console.error("Failed to create collection:", error);
    return { error: "Failed to create collection" };
  }
}

export async function updateCollection(id, data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { name, description, coverImage, isActive, sortOrder } = data;

    const existing = await prisma.galleryCollection.findUnique({ where: { id } });
    if (!existing) {
      return { error: "Collection not found" };
    }

    // Update slug if name changed
    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = generateSlug(name);
      const conflicting = await prisma.galleryCollection.findFirst({
        where: { slug, NOT: { id } },
      });
      if (conflicting) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    const collection = await prisma.galleryCollection.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        coverImage,
        isActive,
        sortOrder,
      },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { collection };
  } catch (error) {
    console.error("Failed to update collection:", error);
    return { error: "Failed to update collection" };
  }
}

export async function deleteCollection(id) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return { error: "Unauthorized" };
    }

    await prisma.galleryCollection.delete({
      where: { id },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return { error: "Failed to delete collection" };
  }
}

// ==================== IMAGES ====================

export async function addImageToCollection(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { collectionId, imageUrl, title, description } = data;

    const image = await prisma.galleryImage.create({
      data: {
        collectionId,
        imageUrl,
        title,
        description,
      },
    });

    // Update collection cover image if it doesn't have one
    if (collectionId) {
      const collection = await prisma.galleryCollection.findUnique({
        where: { id: collectionId },
      });
      if (collection && !collection.coverImage) {
        await prisma.galleryCollection.update({
          where: { id: collectionId },
          data: { coverImage: imageUrl },
        });
      }
    }

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { image };
  } catch (error) {
    console.error("Failed to add image:", error);
    return { error: "Failed to add image" };
  }
}

export async function addMultipleImages(data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { collectionId, images } = data;

    const createdImages = await prisma.galleryImage.createMany({
      data: images.map((img, index) => ({
        collectionId,
        imageUrl: img.imageUrl,
        title: img.title || null,
        sortOrder: index,
      })),
    });

    // Update collection cover image if needed
    if (collectionId && images.length > 0) {
      const collection = await prisma.galleryCollection.findUnique({
        where: { id: collectionId },
      });
      if (collection && !collection.coverImage) {
        await prisma.galleryCollection.update({
          where: { id: collectionId },
          data: { coverImage: images[0].imageUrl },
        });
      }
    }

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { count: createdImages.count };
  } catch (error) {
    console.error("Failed to add images:", error);
    return { error: "Failed to add images" };
  }
}

export async function updateImage(id, data) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    const { title, description, sortOrder, collectionId } = data;

    const image = await prisma.galleryImage.update({
      where: { id },
      data: {
        title,
        description,
        sortOrder,
        collectionId,
      },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { image };
  } catch (error) {
    console.error("Failed to update image:", error);
    return { error: "Failed to update image" };
  }
}

export async function deleteImage(id) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    await prisma.galleryImage.delete({
      where: { id },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete image:", error);
    return { error: "Failed to delete image" };
  }
}

export async function deleteMultipleImages(ids) {
  try {
    const session = await auth();
    if (!session || !["SUPER_ADMIN", "ORGANIZER"].includes(session.user.role)) {
      return { error: "Unauthorized" };
    }

    await prisma.galleryImage.deleteMany({
      where: { id: { in: ids } },
    });

    revalidatePath("/admin/gallery");
    revalidatePath("/gallery");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete images:", error);
    return { error: "Failed to delete images" };
  }
}
