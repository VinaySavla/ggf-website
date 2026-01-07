"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus, Trash2, Loader2, Search, User } from "lucide-react";
import { addPlayerToTeam, removePlayerFromTeam } from "@/actions/team.actions";

export default function RosterManager({ team, availablePlayers, userRole }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [auctionPrice, setAuctionPrice] = useState("");
  const [role, setRole] = useState("");

  const getPlayerName = (player) => {
    if (player.user) {
      return `${player.user.firstName} ${player.user.middleName} ${player.user.surname}`;
    }
    if (player.firstName && player.middleName && player.surname) {
      return `${player.firstName} ${player.middleName} ${player.surname}`;
    }
    return player.playerId || "Unknown";
  };

  const filteredPlayers = availablePlayers.filter((player) => {
    const name = getPlayerName(player);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddPlayer = async () => {
    if (!selectedPlayer) {
      toast.error("Please select a player");
      return;
    }

    const price = auctionPrice ? parseInt(auctionPrice) : 0;
    if (price < 0) {
      toast.error("Auction price cannot be negative");
      return;
    }

    setIsAdding(true);
    try {
      const result = await addPlayerToTeam({
        playerId: selectedPlayer.id,
        teamId: team.id,
        tournamentId: team.tournamentId,
        auctionPrice: price,
        role: role || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Player added to team!");
        setShowAddModal(false);
        setSelectedPlayer(null);
        setAuctionPrice("");
        setRole("");
        setSearchQuery("");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to add player");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePlayer = async (rosterId, playerName) => {
    if (!confirm(`Remove ${playerName} from the team?`)) return;

    setRemovingId(rosterId);
    try {
      const result = await removePlayerFromTeam(rosterId);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Player removed from team");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to remove player");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      {/* Current Roster */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Current Roster</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Player</span>
          </button>
        </div>

        {team.rosters.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Player</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Role</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Auction Price</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.rosters.map((roster) => (
                  <tr key={roster.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {roster.player.photo ? (
                            <img
                              src={roster.player.photo}
                              alt={roster.player.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{roster.player.name}</p>
                          {roster.player.mobile && (
                            <p className="text-sm text-gray-500">{roster.player.mobile}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {roster.role ? (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                          {roster.role}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {roster.auctionPrice > 0 ? (
                        <span className="font-medium">₹{roster.auctionPrice.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRemovePlayer(roster.id, roster.player.name)}
                        disabled={removingId === roster.id}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Remove from team"
                      >
                        {removingId === roster.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No players in this team yet</p>
            <p className="text-sm">Click "Add Player" to build your roster</p>
          </div>
        )}
      </div>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Player to Team</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>

              {/* Player List */}
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayer(player)}
                      className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition ${
                        selectedPlayer?.id === player.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {player.photo ? (
                          <img src={player.photo} alt={getPlayerName(player)} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">{getPlayerName(player)}</span>
                    </button>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-500">
                    {searchQuery ? "No players found" : "No available players"}
                  </p>
                )}
              </div>

              {selectedPlayer && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-gray-600">Selected:</p>
                  <p className="font-medium text-gray-900">{getPlayerName(selectedPlayer)}</p>
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role (Optional)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Select role</option>
                  <option value="Captain">Captain</option>
                  <option value="Vice-Captain">Vice-Captain</option>
                </select>
              </div>

              {/* Auction Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auction Price (Optional)
                </label>
                <input
                  type="number"
                  value={auctionPrice}
                  onChange={(e) => setAuctionPrice(e.target.value)}
                  placeholder="Enter amount in ₹"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedPlayer(null);
                  setSearchQuery("");
                  setAuctionPrice("");
                  setRole("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlayer}
                disabled={!selectedPlayer || isAdding}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Player"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
