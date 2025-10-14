import EventCard from "./EventCard";

export default function UpcomingEvents({ events = [] }) {
  // Default sample events if none provided
  const sampleEvents = [
    {
      id: 1,
      title: "Turf Cricket Tournament",
      date: "2025-11-15",
      description: "Annual cricket tournament with auction and matches. Register as a player and showcase your skills!",
      category: "Sports",
      location: "Godhra Sports Club",
      slug: "cricket-tournament",
    },
    {
      id: 2,
      title: "Quiz Competition",
      date: "2025-11-20",
      description: "Test your knowledge in our annual quiz competition. Great prizes for winners!",
      category: "Education",
      location: "Community Hall",
      slug: "quiz-competition",
    },
    {
      id: 3,
      title: "Ludo Championship",
      date: "2025-12-01",
      description: "Family-friendly ludo tournament. All ages welcome!",
      category: "Games",
      location: "GGF Center",
      slug: "ludo-championship",
    },
  ];

  const displayEvents = events.length > 0 ? events : sampleEvents;

  return (
    <section className="py-16 bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Upcoming Events</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join us in our community events. From sports to education, there's something for everyone!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayEvents.slice(0, 6).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {displayEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No upcoming events at the moment. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
