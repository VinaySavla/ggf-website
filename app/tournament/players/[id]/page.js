import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

// Sample player data - replace with Directus API call
const getPlayer = (id) => {
  const players = [
    {
      id: "1",
      name: "Rajesh Kumar",
      age: 25,
      role: "Batsman",
      status: "Available",
      photo: null,
      stats: {
        matches: 45,
        runs: 1250,
        average: 35.7,
        strikeRate: 142.5,
        fifties: 8,
        centuries: 2,
      },
      details: {
        battingStyle: "Right-handed",
        bowlingStyle: "N/A",
        address: "Godhra, Gujarat",
        phone: "+91 9876543210",
        email: "rajesh@example.com",
      },
    },
    {
      id: "2",
      name: "Amit Patel",
      age: 28,
      role: "Bowler",
      status: "Sold",
      photo: null,
      stats: {
        matches: 50,
        wickets: 65,
        average: 18.2,
        economy: 7.5,
        bestBowling: "4/15",
      },
      details: {
        battingStyle: "Right-handed",
        bowlingStyle: "Right-arm Fast",
        address: "Godhra, Gujarat",
        phone: "+91 9876543211",
        email: "amit@example.com",
      },
    },
  ];

  return players.find((p) => p.id === id);
};

export default function PlayerProfilePage({ params }) {
  const player = getPlayer(params.id);

  if (!player) {
    notFound();
  }

  const getStatusColor = (status) => {
    if (status?.toLowerCase() === "sold") return "bg-gray-500";
    if (status?.toLowerCase() === "available") return "bg-green-500";
    return "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom">
        <Link
          href="/tournament/players"
          className="inline-flex items-center text-primary hover:underline mb-8"
        >
          ← Back to Players
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-3">
            {/* Player Photo */}
            <div className="bg-gray-200 relative h-96 md:h-auto">
              {player.photo ? (
                <Image src={player.photo} alt={player.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-9xl">
                  👤
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="md:col-span-2 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">{player.name}</h1>
                  <p className="text-xl text-gray-600">{player.role}</p>
                </div>
                <span className={`${getStatusColor(player.status)} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
                  {player.status}
                </span>
              </div>

              {/* Personal Details */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Personal Details</h2>
                <div className="grid grid-cols-2 gap-4 text-gray-600">
                  <div>
                    <p className="font-semibold">Age</p>
                    <p>{player.age} years</p>
                  </div>
                  <div>
                    <p className="font-semibold">Role</p>
                    <p>{player.role}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Batting Style</p>
                    <p>{player.details.battingStyle}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Bowling Style</p>
                    <p>{player.details.bowlingStyle}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p>{player.details.address}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Career Stats</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(player.stats).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-primary">{value}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Section (only for available players) */}
              {player.status?.toLowerCase() === "available" && (
                <div className="mt-8 bg-primary/10 p-6 rounded-lg">
                  <h3 className="text-xl font-bold text-primary mb-4">Interested in this player?</h3>
                  <p className="text-gray-600 mb-4">Contact us for more information about player availability and auction details.</p>
                  <Link
                    href="/tournament"
                    className="inline-block bg-primary text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition"
                  >
                    Register for Auction
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
