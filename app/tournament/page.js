"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PlayerCard from "@/components/PlayerCard";
import RegistrationForm from "@/components/RegistrationForm";

export default function TournamentPage() {
  const [players, setPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});

  // Sample players - replace with API call
  const samplePlayers = [
    { id: 1, name: "Rajesh Kumar", age: 25, role: "Batsman", status: "Available", photo: null },
    { id: 2, name: "Amit Patel", age: 28, role: "Bowler", status: "Sold", photo: null },
    { id: 3, name: "Vijay Shah", age: 24, role: "All-rounder", status: "Available", photo: null },
    { id: 4, name: "Kiran Modi", age: 26, role: "Wicket-keeper", status: "Available", photo: null },
  ];

  useEffect(() => {
    setPlayers(samplePlayers);

    // Countdown to auction (November 29, 2025)
    const auctionDate = new Date("2025-11-29T10:00:00").getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = auctionDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ expired: true });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-primary to-purple-900 text-white py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Turf Cricket Tournament 2025</h1>
          <p className="text-xl mb-2">Co-hosted by GGF & GSC</p>
          <p className="text-gray-200">Join us for the most exciting cricket tournament of the year!</p>
        </div>
      </section>

      {/* Countdown Timer */}
      {!timeLeft.expired && timeLeft.days !== undefined && (
        <section className="bg-primary text-white py-8">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold mb-4">Auction Countdown</h2>
            <div className="flex justify-center gap-6">
              <div className="bg-white text-primary px-6 py-4 rounded-lg">
                <div className="text-3xl font-bold">{timeLeft.days}</div>
                <div className="text-sm">Days</div>
              </div>
              <div className="bg-white text-primary px-6 py-4 rounded-lg">
                <div className="text-3xl font-bold">{timeLeft.hours}</div>
                <div className="text-sm">Hours</div>
              </div>
              <div className="bg-white text-primary px-6 py-4 rounded-lg">
                <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                <div className="text-sm">Minutes</div>
              </div>
              <div className="bg-white text-primary px-6 py-4 rounded-lg">
                <div className="text-3xl font-bold">{timeLeft.seconds}</div>
                <div className="text-sm">Seconds</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Tournament Info */}
      <section className="py-16">
        <div className="container-custom">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Tournament Overview</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">📅 Schedule</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Player Registration:</strong> Now Open</li>
                  <li><strong>Auction Date:</strong> November 29, 2025</li>
                  <li><strong>Match Date:</strong> January 4, 2026</li>
                  <li><strong>Venue:</strong> To Be Declared</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-primary mb-4">🏏 Format</h3>
                <ul className="space-y-2 text-gray-600">
                  <li><strong>Type:</strong> 8-over matches</li>
                  <li><strong>Teams:</strong> 8 teams</li>
                  <li><strong>Players per team:</strong> 11</li>
                  <li><strong>Base Price:</strong> 1000 Points</li>
                </ul>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold text-primary mb-4">📋 Rules</h3>
              <ul className="space-y-2 text-gray-600 list-disc list-inside">
                <li>All players must be residents of Godhra or surrounding areas</li>
                <li>Maximum age: 65 years (no minimum age limit)</li>
                <li>Each player must register before the auction</li>
                <li>Base price: 1000 Points (auction is in points, not rupees)</li>
                <li>Auction proceeds go to community development</li>
              </ul>
            </div>
          </div>

          {/* Registration Section */}
          <div className="mb-12">
            <RegistrationForm eventType="player" />
          </div>

          {/* Registered Players */}
          <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Registered Players</h2>
            {players.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {players.map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
                <div className="text-center">
                  <Link 
                    href="/tournament/players" 
                    className="inline-block bg-primary text-white px-8 py-3 rounded-full font-semibold hover:bg-opacity-90 transition"
                  >
                    View All Players
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-12">No players registered yet. Be the first to register!</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
