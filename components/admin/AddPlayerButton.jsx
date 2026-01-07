"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, X, Loader2, User, Link2, Camera, Eye, EyeOff } from "lucide-react";
import { createPlayer, createPlayerWithAccount } from "@/actions/player.actions";

export default function AddPlayerButton({ usersWithoutPlayers = [] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("new"); // "new", "account", or "link"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    bio: "",
    userId: "",
    photo: "",
    password: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (mode === "new" && !formData.name.trim()) {
      toast.error("Player name is required");
      return;
    }
    
    if (mode === "account") {
      if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
        toast.error("Name, email and mobile are required for account creation");
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      if (!formData.photo) {
        toast.error("Profile photo is required");
        return;
      }
    }
    
    if (mode === "link" && !formData.userId) {
      toast.error("Please select a user to link");
      return;
    }

    setIsLoading(true);

    try {
      let result;
      
      if (mode === "link") {
        result = await createPlayer({ userId: formData.userId });
      } else if (mode === "account") {
        result = await createPlayerWithAccount({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
          photo: formData.photo,
          bio: formData.bio || null,
        });
      } else {
        result = await createPlayer({
          name: formData.name,
          email: formData.email || null,
          mobile: formData.mobile || null,
          bio: formData.bio || null,
        });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(mode === "account" ? "Player account created successfully" : "Player created successfully");
        setIsOpen(false);
        setFormData({ name: "", email: "", mobile: "", bio: "", userId: "", photo: "", password: "" });
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to create player");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'profiles');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setFormData({ ...formData, photo: result.url });
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition"
      >
        <Plus className="w-5 h-5" />
        Add Player
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Player</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="p-6 pb-0">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition ${
                    mode === "new"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <User className="w-3 h-3" />
                  Player Only
                </button>
                <button
                  type="button"
                  onClick={() => setMode("account")}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition ${
                    mode === "account"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  With Account
                </button>
                <button
                  type="button"
                  onClick={() => setMode("link")}
                  disabled={usersWithoutPlayers.length === 0}
                  className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition ${
                    mode === "link"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  } ${usersWithoutPlayers.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Link2 className="w-3 h-3" />
                  Link ({usersWithoutPlayers.length})
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {mode === "new" && "Create player without login account"}
                {mode === "account" && "Create player with full login account"}
                {mode === "link" && "Link existing user to player profile"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === "link" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select User to Link <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="">Select a user...</option>
                    {usersWithoutPlayers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {`${user.firstName} ${user.middleName} ${user.surname}`} ({user.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Only users without existing player profiles are shown.
                  </p>
                </div>
              ) : (
                <>
                  {/* Photo Upload (only for account mode) */}
                  {mode === "account" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Photo <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center justify-center">
                        {formData.photo ? (
                          <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                              <Image
                                src={formData.photo}
                                alt="Profile preview"
                                width={96}
                                height={96}
                                className="object-cover w-full h-full"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, photo: '' })}
                              className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition bg-gray-50">
                            {uploadingPhoto ? (
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            ) : (
                              <>
                                <Camera className="w-6 h-6 text-gray-400" />
                                <span className="text-xs text-gray-500 mt-1">Upload</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="Player's full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email {mode === "account" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="player@example.com"
                      required={mode === "account"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile {mode === "account" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      placeholder="+91 9876543210"
                      required={mode === "account"}
                    />
                  </div>

                  {/* Password (only for account mode) */}
                  {mode === "account" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="Min 6 characters"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                      placeholder="Short bio about the player..."
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Player
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
