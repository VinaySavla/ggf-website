"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Upload, X, Camera } from "lucide-react";
import { registerUser } from "@/actions/auth.actions";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    mobile: "",
    village: "",
    gender: "",
    password: "",
    confirmPassword: "",
    photo: "",
  });

  // Handle profile photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
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

      // Upload without auth for registration (public endpoint)
      const response = await fetch('/api/upload/public', {
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

  const removePhoto = () => {
    setFormData({ ...formData, photo: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate single word per name field
    if (formData.firstName.trim().split(/\s+/).length > 1) {
      toast.error("First name should be a single word only");
      return;
    }

    if (formData.middleName.trim().split(/\s+/).length > 1) {
      toast.error("Middle name should be a single word only");
      return;
    }

    if (formData.surname.trim().split(/\s+/).length > 1) {
      toast.error("Surname should be a single word only");
      return;
    }
    
    // Validate mobile number (10 digits only)
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    
    if (!formData.gender) {
      toast.error("Please select your gender");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser({
        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim(),
        surname: formData.surname.trim(),
        email: formData.email,
        mobile: formData.mobile,
        village: formData.village,
        gender: formData.gender,
        password: formData.password,
        photo: formData.photo,
      });

      if (result.error) {
        if (result.error.includes("already exists")) {
          toast.error("Account already exists. Redirecting to login...");
          setTimeout(() => router.push("/login"), 1500);
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success("Registration successful! Please login.");
        router.push("/login");
      }
    } catch (error) {
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
            <p className="text-gray-600 mt-2">Join the GGF Community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Profile Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="flex items-center justify-center">
                {formData.photo ? (
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                      <Image
                        src={formData.photo}
                        alt="Profile preview"
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary-600 transition cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                  </div>
                ) : (
                  <label className={`w-32 h-32 rounded-full border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${uploadingPhoto ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}>
                    {uploadingPhoto ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 text-center px-2">Click to upload</span>
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
              <p className="text-xs text-gray-500 text-center mt-2">Max 5MB, JPG/PNG</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow single word (no spaces)
                  if (!value.includes(' ')) {
                    setFormData({ ...formData, firstName: value });
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your first name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Single word only, no spaces</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.middleName}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow single word (no spaces)
                  if (!value.includes(' ')) {
                    setFormData({ ...formData, middleName: value });
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your middle name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Single word only, no spaces</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">                Village <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) =>
                  setFormData({ ...formData, village: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your village name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">                Surname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.surname}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow single word (no spaces)
                  if (!value.includes(' ')) {
                    setFormData({ ...formData, surname: value });
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your surname"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Single word only, no spaces</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only digits
                  if (value.length <= 10) {
                    setFormData({ ...formData, mobile: value });
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Enter your 10-digit mobile number"
                maxLength={10}
                pattern="\d{10}"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {["Male", "Female", "Other"].map((gender) => (
                  <label key={gender} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={gender}
                      checked={formData.gender === gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
                      required
                    />
                    <span className="ml-2 text-gray-700">{gender}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition pr-12"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary-600 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
