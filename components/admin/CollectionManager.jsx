"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  X,
  Check,
  Edit2,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  addMultipleImages,
  deleteImage,
  deleteMultipleImages,
  updateCollection,
  deleteCollection,
} from "@/actions/gallery.actions";

export default function CollectionManager({ collection, userRole }) {
  const router = useRouter();
  const [images, setImages] = useState(collection.images);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [settings, setSettings] = useState({
    name: collection.name,
    description: collection.description || "",
    isActive: collection.isActive,
  });

  // Handle multiple file uploads
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) {
      toast.error("Please select image files");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadedImages = [];

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", `gallery/${collection.slug}`);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        uploadedImages.push({
          imageUrl: result.url,
          title: file.name.replace(/\.[^/.]+$/, ""),
        });

        setUploadProgress(Math.round(((i + 1) / imageFiles.length) * 100));
      }

      // Add images to collection
      const result = await addMultipleImages({
        collectionId: collection.id,
        images: uploadedImages,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${uploadedImages.length} images uploaded successfully`);
        router.refresh();
      }
    } catch (error) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Toggle image selection
  const toggleSelectImage = (imageId) => {
    setSelectedImages((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Select all images
  const selectAllImages = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map((img) => img.id));
    }
  };

  // Delete selected images
  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;

    if (!confirm(`Delete ${selectedImages.length} images? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);

    try {
      const result = await deleteMultipleImages(selectedImages);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${selectedImages.length} images deleted`);
        setImages((prev) => prev.filter((img) => !selectedImages.includes(img.id)));
        setSelectedImages([]);
      }
    } catch (error) {
      toast.error("Failed to delete images");
    } finally {
      setDeleting(false);
    }
  };

  // Delete single image
  const handleDeleteImage = async (imageId) => {
    if (!confirm("Delete this image?")) return;

    try {
      const result = await deleteImage(imageId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Image deleted");
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  // Update collection settings
  const handleUpdateSettings = async () => {
    setEditingSettings(true);

    try {
      const result = await updateCollection(collection.id, settings);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings updated");
        setShowSettings(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setEditingSettings(false);
    }
  };

  // Delete collection
  const handleDeleteCollection = async () => {
    if (!confirm("Delete this entire collection and all its images? This cannot be undone.")) {
      return;
    }

    try {
      const result = await deleteCollection(collection.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Collection deleted");
        router.push("/admin/gallery");
      }
    } catch (error) {
      toast.error("Failed to delete collection");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/gallery"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary transition mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {collection.name}
            {!collection.isActive && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                Hidden
              </span>
            )}
          </h1>
          {collection.description && (
            <p className="text-gray-500 mt-1">{collection.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition"
          >
            <Settings className="w-5 h-5" />
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition cursor-pointer">
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Upload Images
              </>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Selection Bar */}
      {images.length > 0 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-4">
            <button
              onClick={selectAllImages}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedImages.length === images.length
                    ? "bg-primary border-primary text-white"
                    : "border-gray-300"
                }`}
              >
                {selectedImages.length === images.length && <Check className="w-3 h-3" />}
              </div>
              Select All
            </button>
            {selectedImages.length > 0 && (
              <span className="text-sm text-gray-500">
                {selectedImages.length} selected
              </span>
            )}
          </div>

          {selectedImages.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Selected
            </button>
          )}
        </div>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Images Yet</h3>
          <p className="text-gray-500 mb-6">Upload images to this collection</p>
          <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition cursor-pointer">
            <Upload className="w-5 h-5" />
            Upload Images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`group relative aspect-square rounded-lg overflow-hidden bg-gray-100 ${
                selectedImages.includes(image.id) ? "ring-2 ring-primary" : ""
              }`}
            >
              <Image
                src={image.imageUrl}
                alt={image.title || "Gallery image"}
                fill
                className="object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Selection Checkbox */}
              <button
                onClick={() => toggleSelectImage(image.id)}
                className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                  selectedImages.includes(image.id)
                    ? "bg-primary border-primary text-white"
                    : "bg-white/80 border-gray-300 group-hover:opacity-100 opacity-0"
                }`}
              >
                {selectedImages.includes(image.id) && <Check className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Collection Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Visibility</p>
                  <p className="text-sm text-gray-500">Show in public gallery</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, isActive: !settings.isActive })}
                  className={`p-2 rounded-full ${
                    settings.isActive ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {settings.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSettings}
                  disabled={editingSettings}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {editingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>

              {userRole === "SUPER_ADMIN" && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleDeleteCollection}
                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm"
                  >
                    Delete Collection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
