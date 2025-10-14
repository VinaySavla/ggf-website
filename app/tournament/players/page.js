"use client";

import { useState, useEffect } from "react";
import PlayerCard from "@/components/PlayerCard";

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [filter, setFilter] = useState("all");

  // Sample players - replace with Directus API call
  const samplePlayers = [
    { id: 1, name: "Rajesh Kumar", age: 25, role: "Batsman", status: "Available", photo: null },
    { id: 2, name: "Amit Patel", age: 28, role: "Bowler", status: "Sold", photo: null },
    { id: 3, name: "Vijay Shah", age: 24, role: "All-rounder", status: "Available", photo: null },
    { id: 4, name: "Kiran Modi", age: 26, role: "Wicket-keeper", status: "Available", photo: null },
    { id: 5, name: "Suresh Desai", age: 27, role: "Batsman", status: "Sold", photo: null },
    { id: 6, name: "Prakash Joshi", age: 23, role: "Bowler", status: "Available", photo: null },
    { id: 7, name: "Nitin Mehta", age: 29, role: "All-rounder", status: "Available", photo: null },
    { id: 8, name: "Rahul Vora", age: 25, role: "Batsman", status: "Available", photo: null },
  ];

  useEffect(() => {
    setPlayers(samplePlayers);
  }, []);

  const filteredPlayers = filter === "all" 
    ? players 
    : players.filter(p => p.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Tournament Players</h1>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setFilter("all")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All Players
          </button>
          <button
            onClick={() => setFilter("available")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              filter === "available"
                ? "bg-green-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setFilter("sold")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              filter === "sold"
                ? "bg-gray-500 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Sold
          </button>
        </div>

        {/* Players Grid */}
        {filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">No players found.</p>
        )}
      </div>
    </div>
  );
}
