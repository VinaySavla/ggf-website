import Link from "next/link";
import Image from "next/image";

export default function PlayerCard({ player }) {
  const getStatusColor = (status) => {
    if (status?.toLowerCase() === "sold") return "bg-red-500";
    if (status?.toLowerCase() === "available") return "bg-green-500";
    return "bg-gray-500";
  };

  const getRoleIcon = (role) => {
    if (role?.toLowerCase().includes("bat")) return "🏏";
    if (role?.toLowerCase().includes("bowl")) return "⚡";
    if (role?.toLowerCase().includes("all")) return "⭐";
    return "👤";
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Player Photo */}
      <div className="relative h-64 bg-gray-200">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
            👤
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 ${getStatusColor(player.status)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
          {player.status || "Available"}
        </div>
      </div>

      {/* Player Info */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{player.name}</h3>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          {player.age && (
            <p>🎂 Age: {player.age} years</p>
          )}
          {player.role && (
            <p>{getRoleIcon(player.role)} Role: {player.role}</p>
          )}
        </div>

        <Link
          href={`/tournament/players/${player.id}`}
          className="block w-full bg-primary text-white text-center px-4 py-2 rounded-lg hover:bg-opacity-90 transition font-medium"
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}
