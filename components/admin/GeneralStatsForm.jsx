"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Save, Loader2, Search, User, ChevronDown, ChevronUp,
  Plus, Trash2, X, Tag
} from "lucide-react";
import { bulkCreateStats, deletePlayerStats } from "@/actions/stats.actions";

export default function GeneralStatsForm({ players, sports, existingStats }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSport, setSelectedSport] = useState(sports[0]?.id || "");
  const [statsLabel, setStatsLabel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [playerStats, setPlayerStats] = useState(() => {
    // Initialize with existing stats as array of {key, value} pairs
    const initial = {};
    players.forEach((player) => {
      const existing = existingStats[player.id]?.find(
        (s) => s.sportId === sports[0]?.id
      );
      if (existing && existing.statsJson) {
        initial[player.id] = Object.entries(existing.statsJson).map(([key, value]) => ({
          key,
          value: String(value),
        }));
      }
    });
    return initial;
  });

  const selectedSportObj = sports.find((s) => s.id === selectedSport);

  // Filter players by search
  const filteredPlayers = players.filter((player) =>
    player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.playerId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePlayer = (playerId) => {
    setExpandedPlayers((prev) => ({
      ...prev,
      [playerId]: !prev[playerId],
    }));
  };

  // Add a new stat field for a player
  const addStatField = (playerId) => {
    setPlayerStats((prev) => ({
      ...prev,
      [playerId]: [...(prev[playerId] || []), { key: "", value: "" }],
    }));
  };

  // Remove a stat field for a player
  const removeStatField = (playerId, index) => {
    setPlayerStats((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || []).filter((_, i) => i !== index),
    }));
  };

  // Update stat key or value
  const updateStatField = (playerId, index, field, value) => {
    setPlayerStats((prev) => ({
      ...prev,
      [playerId]: (prev[playerId] || []).map((stat, i) =>
        i === index ? { ...stat, [field]: value } : stat
      ),
    }));
  };

  const handleSportChange = (sportId) => {
    setSelectedSport(sportId);
    // Load existing stats for the new sport
    const newStats = {};
    players.forEach((player) => {
      const existing = existingStats[player.id]?.find((s) => s.sportId === sportId);
      if (existing && existing.statsJson) {
        newStats[player.id] = Object.entries(existing.statsJson).map(([key, value]) => ({
          key,
          value: String(value),
        }));
      }
    });
    setPlayerStats(newStats);
  };

  const handleSaveAll = async () => {
    // Convert array format back to object and filter out empty entries
    const playersWithStats = Object.entries(playerStats)
      .map(([playerId, statsArray]) => {
        const statsJson = {};
        (statsArray || []).forEach(({ key, value }) => {
          if (key.trim()) {
            const numValue = parseFloat(value);
            statsJson[key.trim()] = !isNaN(numValue) ? numValue : value;
          }
        });
        return { playerId, statsJson };
      })
      .filter(({ statsJson }) => Object.keys(statsJson).length > 0);

    if (playersWithStats.length === 0) {
      toast.error("No stats to save");
      return;
    }

    setIsLoading(true);

    try {
      const result = await bulkCreateStats({
        tournamentId: null, // No tournament - general stats
        sportId: selectedSport,
        playerStats: playersWithStats,
        label: statsLabel || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Saved stats for ${playersWithStats.length} players`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to save stats");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStats = async (recordId, playerName) => {
    if (!confirm(`Delete stats for ${playerName}?`)) return;

    try {
      const result = await deletePlayerStats(recordId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Stats deleted");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete stats");
    }
  };

  const getExistingRecord = (playerId) => {
    return existingStats[playerId]?.find((s) => s.sportId === selectedSport);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Sport Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => handleSportChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            >
              {sports.map((sport) => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stats Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stats Label (Optional)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={statsLabel}
                onChange={(e) => setStatsLabel(e.target.value)}
                placeholder="e.g., Career Stats, Season 2024..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Players
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          <strong>General Stats for {selectedSportObj?.name || "selected sport"}:</strong>{" "}
          These stats are not linked to any tournament. Use the label field to categorize stats 
          (e.g., "Career Stats", "Season 2024", "Practice Stats").
        </p>
      </div>

      {/* Players List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Players ({filteredPlayers.length})
          </h3>
          <button
            onClick={handleSaveAll}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save All Stats
          </button>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredPlayers.map((player) => {
            const isExpanded = expandedPlayers[player.id];
            const existingRecord = getExistingRecord(player.id);
            const currentStats = playerStats[player.id] || [];
            const hasStats = currentStats.some(s => s.key.trim() && s.value.trim());

            return (
              <div key={player.id} className="bg-white">
                {/* Player Header */}
                <div
                  onClick={() => togglePlayer(player.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{player.name}</p>
                      <p className="text-sm text-gray-500">{player.playerId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {existingRecord && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        {existingRecord.label || "Has Stats"}
                      </span>
                    )}
                    {hasStats && !existingRecord && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        Unsaved
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Stats Form (Expanded) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-100">
                    {/* Dynamic Stat Fields */}
                    <div className="space-y-3">
                      {currentStats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <input
                            type="text"
                            value={stat.key}
                            onChange={(e) => updateStatField(player.id, index, "key", e.target.value)}
                            placeholder="Stat name (e.g., Runs)"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          />
                          <input
                            type="text"
                            value={stat.value}
                            onChange={(e) => updateStatField(player.id, index, "value", e.target.value)}
                            placeholder="Value"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                          />
                          <button
                            onClick={() => removeStatField(player.id, index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove field"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Field Button */}
                    <button
                      onClick={() => addStatField(player.id)}
                      className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Stat Field
                    </button>

                    {existingRecord && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {existingRecord.label && <span className="font-medium mr-2">{existingRecord.label}</span>}
                          Last updated: {new Date(existingRecord.updatedAt).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDeleteStats(existingRecord.id, player.name)}
                          className="text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Stats
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="p-12 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No players found</p>
          </div>
        )}
      </div>
    </div>
  );
}
