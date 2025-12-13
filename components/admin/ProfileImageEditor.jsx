"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Loader2, X } from "lucide-react";

export default function ProfileImageEditor({ currentPhoto, userId, playerId, canEdit }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!canEdit) {
    return null;
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setPendingFile(file);
      setShowConfirm(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);

    try {
      // Upload new image
      const uploadFormData = new FormData();
      uploadFormData.append('file', pendingFile);
      uploadFormData.append('folder', 'profiles');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Update profile with new image and delete old one
      const updateRes = await fetch('/api/profile/photo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPhotoUrl: uploadResult.url,
          oldPhotoUrl: currentPhoto,
        }),
      });

      const updateResult = await updateRes.json();

      if (!updateRes.ok) {
        throw new Error(updateResult.error || 'Failed to update profile');
      }

      toast.success('Profile photo updated successfully');
      setShowConfirm(false);
      setPendingFile(null);
      setPreviewUrl(null);
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to update photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingFile(null);
    setPreviewUrl(null);
  };

  return (
    <>
      {/* Edit Button Overlay */}
      <label className="absolute bottom-2 right-2 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition cursor-pointer shadow-lg">
        <Camera className="w-5 h-5" />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </label>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Profile Photo</h3>
              <button
                onClick={handleCancel}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                disabled={isUploading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {currentPhoto && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Current</p>
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                    <Image
                      src={currentPhoto}
                      alt="Current photo"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex items-center text-gray-400">→</div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">New</p>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary">
                  {previewUrl && (
                    <Image
                      src={previewUrl}
                      alt="New photo preview"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 text-center">
              Are you sure you want to update your profile photo?
              {currentPhoto && " The old photo will be permanently deleted."}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Photo"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
