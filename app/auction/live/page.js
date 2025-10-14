"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

export default function AuctionLivePage() {
  const [playerId, setPlayerId] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTeams, setShowTeams] = useState(false);

  // Fetch teams data
  const fetchTeams = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
      
      // Fetch teams with their players
      const response = await axios.get(`${apiUrl}/items/teams`, {
        params: {
          fields: ['*', 'players.*'],
        },
      });
      
      // Calculate stats for each team
      const teamsWithStats = response.data.data.map(team => {
        const soldPlayers = team.players?.filter(p => p.status === 'Sold') || [];
        const totalSpent = soldPlayers.reduce((sum, p) => sum + (p.sold_price || 0), 0);
        const remaining = (team.total_points || 200000) - totalSpent;
        const playersCount = soldPlayers.length;
        const maxPlayers = team.max_players || 12;
        const remainingSlots = maxPlayers - playersCount;
        
        // Calculate maximum bid allowed
        // Need to save enough for remaining slots at base price (1000 each)
        const reserveForSlots = remainingSlots > 0 ? (remainingSlots - 1) * 1000 : 0;
        const maxBidAllowed = remaining - reserveForSlots;
        
        return {
          ...team,
          soldPlayers,
          totalSpent,
          remaining,
          playersCount,
          maxBidAllowed: maxBidAllowed > 0 ? maxBidAllowed : 0
        };
      });
      
      setTeams(teamsWithStats);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  // Fetch player by ID
  const handleFetchPlayer = async () => {
    if (!playerId) {
      setError("Please enter a player ID");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
      const response = await axios.get(`${apiUrl}/items/players/${playerId}`);
      setCurrentPlayer(response.data.data);
      setLoading(false);
      
      // Refresh team data when a new player is shown
      fetchTeams();
    } catch (err) {
      console.error("Error fetching player:", err);
      setError(`Player with ID ${playerId} not found`);
      setCurrentPlayer(null);
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFetchPlayer();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-purple-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🏏 GGF Cricket Auction 2025
          </h1>
          <p className="text-xl mb-6">Enter the drawn player ID to display their card</p>
          
          {/* Player ID Input */}
          <div className="max-w-2xl mx-auto flex gap-4 mb-6">
            <input
              type="number"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter Player ID (e.g., 1, 2, 3...)"
              className="flex-1 px-6 py-4 text-2xl rounded-xl text-gray-800 font-semibold focus:ring-4 focus:ring-white/50 outline-none"
            />
            <button
              onClick={handleFetchPlayer}
              disabled={loading}
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-xl hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Show Player"}
            </button>
          </div>

          {/* View Teams Button */}
          <button
            onClick={() => setShowTeams(!showTeams)}
            className="bg-accent text-white px-8 py-3 rounded-full font-semibold hover:bg-accent-600 transition"
          >
            {showTeams ? "Hide" : "View"} Team Lists
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-500 text-white p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Player Card Display */}
        {currentPlayer && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Player Photo Section */}
              <div className="relative h-96 bg-gradient-to-br from-primary/10 to-purple-100">
                {currentPlayer.photo ? (
                  <Image
                    src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${currentPlayer.photo}`}
                    alt={currentPlayer.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-9xl">👤</div>
                  </div>
                )}
                
                {/* Player ID Badge */}
                <div className="absolute top-6 left-6">
                  <div className="bg-white px-6 py-3 rounded-full shadow-lg">
                    <span className="text-gray-600 font-semibold">ID:</span>
                    <span className="text-primary font-bold text-2xl ml-2">#{currentPlayer.id}</span>
                  </div>
                </div>

                {/* Status Badge */}
                {currentPlayer.status && (
                  <div className="absolute top-6 right-6">
                    <div className={`px-6 py-3 rounded-full text-white font-bold text-lg shadow-lg ${
                      currentPlayer.status === "Sold"
                        ? "bg-green-500"
                        : currentPlayer.status === "Unsold"
                        ? "bg-gray-500"
                        : "bg-yellow-500"
                    }`}>
                      {currentPlayer.status}
                    </div>
                  </div>
                )}
              </div>

              {/* Player Info */}
              <div className="p-8">
                <h2 className="text-4xl font-bold text-gray-800 mb-6">
                  {currentPlayer.name}
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Age</p>
                    <p className="text-3xl font-bold text-blue-600">{currentPlayer.age}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <p className="text-gray-600 text-sm mb-1">Role</p>
                    <p className="text-xl font-bold text-purple-600">{currentPlayer.role}</p>
                  </div>
                  {currentPlayer.batting_style && (
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-gray-600 text-sm mb-1">Batting</p>
                      <p className="text-lg font-semibold text-green-600">{currentPlayer.batting_style}</p>
                    </div>
                  )}
                  {currentPlayer.bowling_style && (
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <p className="text-gray-600 text-sm mb-1">Bowling</p>
                      <p className="text-lg font-semibold text-orange-600">{currentPlayer.bowling_style}</p>
                    </div>
                  )}
                </div>

                {/* Base Price */}
                <div className="bg-gradient-to-r from-primary/10 to-purple-100 rounded-2xl p-6 text-center">
                  <p className="text-gray-600 text-lg mb-2">Base Price</p>
                  <p className="text-5xl font-bold text-primary">
                    {(currentPlayer.base_price || 1000).toLocaleString()} Points
                  </p>
                </div>

                {/* If Sold, show selling price and team */}
                {currentPlayer.status === "Sold" && currentPlayer.sold_price && (
                  <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl p-6">
                    <p className="text-gray-600 text-lg mb-2 text-center">Sold For</p>
                    <p className="text-5xl font-bold text-green-600 text-center mb-4">
                      {currentPlayer.sold_price.toLocaleString()} Points
                    </p>
                    {currentPlayer.team_id && (
                      <p className="text-center text-xl">
                        <span className="text-gray-600">Team: </span>
                        <span className="font-bold text-gray-800">
                          {teams.find(t => t.id === currentPlayer.team_id)?.name || `Team #${currentPlayer.team_id}`}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Teams List (Toggle View) */}
        {showTeams && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Team Lists & Points Summary
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="border-2 rounded-xl p-6 hover:shadow-lg transition"
                    style={{ borderColor: team.color_primary || '#6B1E9B' }}
                  >
                    {/* Team Header */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                      {team.logo && (
                        <Image
                          src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${team.logo}`}
                          alt={team.name}
                          width={50}
                          height={50}
                          className="rounded-full"
                        />
                      )}
                      <div>
                        <h3
                          className="text-2xl font-bold"
                          style={{ color: team.color_primary || '#1f2937' }}
                        >
                          {team.name}
                        </h3>
                        {team.owner_name && (
                          <p className="text-sm text-gray-600">Owner: {team.owner_name}</p>
                        )}
                      </div>
                    </div>

                    {/* Team Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Players</p>
                        <p className="text-xl font-bold text-blue-600">
                          {team.playersCount} / {team.max_players || 12}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Total Kitty</p>
                        <p className="text-lg font-bold text-purple-600">
                          {(team.total_points || 200000).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Used</p>
                        <p className="text-lg font-bold text-red-600">
                          {team.totalSpent.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 mb-1">Remaining</p>
                        <p className="text-lg font-bold text-green-600">
                          {team.remaining.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Max Bid Allowed */}
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-100 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-700 mb-1">Maximum Bid Allowed</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {team.maxBidAllowed.toLocaleString()} Points
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        (Reserved for {(team.max_players || 12) - team.playersCount} remaining slots)
                      </p>
                    </div>

                    {/* Players List */}
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">Squad:</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {team.soldPlayers.length > 0 ? (
                          team.soldPlayers.map((player) => (
                            <div
                              key={player.id}
                              className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                            >
                              <span className="font-medium">
                                #{player.id} {player.name}
                              </span>
                              <span className="font-bold text-primary">
                                {player.sold_price?.toLocaleString()} pts
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-400 text-center py-2 text-xs">
                            No players yet
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Full Details Link */}
                    <Link
                      href="/teams"
                      className="block text-center mt-4 text-primary hover:text-primary-600 font-semibold text-sm"
                    >
                      View Full Squad →
                    </Link>
                  </div>
                ))}
              </div>

              {teams.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No teams registered yet
                </p>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        {!currentPlayer && !error && (
          <div className="max-w-2xl mx-auto text-center text-white mt-12">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-semibold mb-2">How It Works</h2>
            <ol className="text-left space-y-2 bg-white/10 backdrop-blur-lg rounded-xl p-6">
              <li>1. Draw a random player ID offline</li>
              <li>2. Enter the ID in the box above</li>
              <li>3. Player card will be displayed</li>
              <li>4. Manage auction on Directus (mark as Sold/Unsold, set team & price)</li>
              <li>5. Click "View Team Lists" to see all team statistics</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
