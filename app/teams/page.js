"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import axios from "axios";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
      
      // Fetch teams with their players
      const response = await axios.get(`${apiUrl}/items/teams`, {
        params: {
          fields: ['*', 'players.*'],
        },
      });
      
      setTeams(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teams:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <div className="text-2xl text-gray-600">Loading teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Tournament Teams
          </h1>
          <p className="text-xl text-gray-600">
            View all teams and their rosters for the Cricket Tournament 2025
          </p>
        </div>

        {/* Teams Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
          {teams.map((team) => {
            const soldPlayers = team.players?.filter(p => p.status === 'Sold') || [];
            const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
            const remaining = (team.total_points || 200000) - totalSpent;
            
            return (
              <div
                key={team.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
                onClick={() => setSelectedTeam(team)}
              >
                {/* Team Header */}
                <div
                  className="p-6 text-white"
                  style={{
                    background: team.color_primary
                      ? `linear-gradient(135deg, ${team.color_primary}, ${team.color_secondary || team.color_primary})`
                      : 'linear-gradient(135deg, #6B1E9B, #9D3DFF)',
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    {team.logo && (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${team.logo}`}
                        alt={team.name}
                        width={60}
                        height={60}
                        className="rounded-full bg-white p-1"
                      />
                    )}
                    <div>
                      <h2 className="text-3xl font-bold">{team.name}</h2>
                      {team.owner_name && (
                        <p className="text-white/90 text-sm">Owner: {team.owner_name}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {soldPlayers.length}
                      </div>
                      <div className="text-xs text-gray-600">Players</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-lg font-bold text-red-600">
                        {totalSpent.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Used</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        {remaining.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Remaining</div>
                    </div>
                  </div>

                  {/* Quick Player List */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                      <span>Squad</span>
                      <span className="text-sm text-gray-500">
                        {soldPlayers.length}/{team.max_players || 12}
                      </span>
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {soldPlayers.length > 0 ? (
                        soldPlayers.map((player) => (
                          <div
                            key={player.id}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm"
                          >
                            <div>
                              <span className="font-medium">{player.name}</span>
                              <span className="text-gray-500 text-xs ml-2">
                                ({player.role})
                              </span>
                            </div>
                            <span className="font-semibold text-primary">
                              {player.sold_price?.toLocaleString()} pts
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-center py-4 text-sm">
                          No players acquired yet
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTeam(team)}
                    className="w-full mt-4 bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-600 transition"
                  >
                    View Full Squad
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {teams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No teams registered yet</p>
          </div>
        )}
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTeam(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="p-8 text-white relative"
              style={{
                background: selectedTeam.color_primary
                  ? `linear-gradient(135deg, ${selectedTeam.color_primary}, ${selectedTeam.color_secondary || selectedTeam.color_primary})`
                  : 'linear-gradient(135deg, #6B1E9B, #9D3DFF)',
              }}
            >
              <button
                onClick={() => setSelectedTeam(null)}
                className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2"
              >
                ✕
              </button>
              <div className="flex items-center gap-4">
                {selectedTeam.logo && (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${selectedTeam.logo}`}
                    alt={selectedTeam.name}
                    width={80}
                    height={80}
                    className="rounded-full bg-white p-2"
                  />
                )}
                <div>
                  <h2 className="text-4xl font-bold">{selectedTeam.name}</h2>
                  {selectedTeam.owner_name && (
                    <p className="text-white/90">Owner: {selectedTeam.owner_name}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {/* Team Statistics */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedTeam.players?.filter(p => p.status === 'Sold').length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    {selectedTeam.total_points?.toLocaleString() || '200,000'}
                  </div>
                  <div className="text-sm text-gray-600">Total Budget</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">
                    {selectedTeam.players?.filter(p => p.status === 'Sold')
                      .reduce((sum, p) => sum + (p.sold_price || 0), 0)
                      .toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">Points Used</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {((selectedTeam.total_points || 200000) -
                      (selectedTeam.players?.filter(p => p.status === 'Sold')
                        .reduce((sum, p) => sum + (p.sold_price || 0), 0) || 0)
                    ).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
              </div>

              {/* Full Squad List */}
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Complete Squad
                </h3>
                <div className="space-y-3">
                  {selectedTeam.players?.filter(p => p.status === 'Sold').map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-4">
                        {player.photo && (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${player.photo}`}
                            alt={player.name}
                            width={50}
                            height={50}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <h4 className="font-bold text-lg">{player.name}</h4>
                          <div className="flex gap-3 text-sm text-gray-600">
                            <span>{player.role}</span>
                            <span>•</span>
                            <span>{player.age} years</span>
                            {player.batting_style && (
                              <>
                                <span>•</span>
                                <span>{player.batting_style}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {player.sold_price?.toLocaleString()} pts
                        </div>
                        <div className="text-xs text-gray-500">
                          Base: {player.base_price?.toLocaleString() || '1,000'} pts
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedTeam.players || selectedTeam.players.filter(p => p.status === 'Sold').length === 0) && (
                    <p className="text-center text-gray-400 py-8">
                      No players in squad yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
