"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createTeam, updateTeam } from "@/actions/team.actions";

export default function TeamForm({ team, tournaments = [] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: team?.name || "",
    tournamentId: team?.tournamentId || "",
    color: team?.color || "#6B1E9B",
    logo: team?.logo || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          Team Color
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            placeholder="#6B1E9B"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo URL
        </label>
        <input
          type="text"
          name="logo"
          value={formData.logo}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
          placeholder="Enter logo image URL"
        />
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
