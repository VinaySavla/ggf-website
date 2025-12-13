"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { createTeam, updateTeam } from "@/actions/team.actions";

export default function TeamForm({ team, tournaments = [] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    name: team?.name || "",
    tournamentId: team?.tournamentId || "",
    logo: team?.logo || "",
    gender: team?.gender || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      formDataUpload.append("folder", "teams/logos");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setFormData((prev) => ({ ...prev, logo: data.url }));
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.tournamentId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      let result;
      if (team) {
        result = await updateTeam(team.id, formData);
      } else {
        result = await createTeam(formData);
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(team ? "Team updated successfully!" : "Team created successfully!");
        router.push("/admin/teams");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to save team");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter team name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tournament <span className="text-red-500">*</span>
        </label>
        <select
          name="tournamentId"
          value={formData.tournamentId}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          required
          disabled={!!team}
        >
          <option value="">Select a tournament</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.event.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gender (Optional)
        </label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Logo (Optional)
        </label>
        {formData.logo ? (
          <div className="relative w-32 h-32 border border-gray-300 rounded-lg overflow-hidden">
            <Image
              src={formData.logo}
              alt="Team Logo"
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={removeLogo}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
              disabled={uploadingLogo}
            />
            <label
              htmlFor="logo-upload"
              className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition"
            >
              {uploadingLogo ? (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto text-gray-400" />
                  <span className="text-sm text-gray-500 mt-1">Upload Logo</span>
                </div>
              )}
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {team ? "Updating..." : "Creating..."}
            </>
          ) : (
            team ? "Update Team" : "Create Team"
          )}
        </button>
      </div>
    </form>
  );
}
