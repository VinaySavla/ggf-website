import Link from "next/link";

export default function EventCard({ event }) {
  const formatDate = (dateString) => {
    if (!dateString) return "Date TBA";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Event Header */}
      <div className="bg-gradient-to-r from-primary to-purple-700 p-6">
        <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
        <p className="text-gray-100 text-sm">📅 {formatDate(event.date)}</p>
      </div>

      {/* Event Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
        
        {event.location && (
          <p className="text-sm text-gray-500 mb-4">📍 {event.location}</p>
        )}

        <div className="flex items-center justify-between">
          {event.category && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
              {event.category}
            </span>
          )}
          
          <Link
            href={`/events/${event.slug || event.id}`}
            className="bg-accent text-white px-6 py-2 rounded-full hover:bg-red-600 transition font-medium text-sm"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
}
