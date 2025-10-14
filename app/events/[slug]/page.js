import Link from "next/link";
import { notFound } from "next/navigation";
import RegistrationForm from "@/components/RegistrationForm";

// Sample event data - replace with Directus API
const getEvent = (slug) => {
  const events = [
    {
      slug: "cricket-tournament",
      title: "Turf Cricket Tournament 2025",
      date: "2025-11-15",
      description: "Annual cricket tournament with auction and matches. Register as a player and showcase your skills!",
      category: "Sports",
      location: "Godhra Sports Club",
      fullDescription: `Join us for the most exciting cricket tournament of the year! This tournament is co-hosted by 
      Godhra Graduates Forum and Godhra Sports Club. We're bringing together the best cricket talent from Godhra 
      and surrounding areas.
      
      The tournament features an IPL-style auction where teams bid for players, followed by exciting 8-over matches 
      throughout January 2026. Whether you're a batsman, bowler, or all-rounder, this is your chance to shine!`,
      rules: [
        "Maximum age: 65 years (no minimum age limit)",
        "Residents of Godhra or surrounding areas only",
        "Registration closes on November 25, 2025",
        "Base price for players: 1000 Points",
        "8-over matches, standard cricket rules apply",
      ],
      prizes: ["Winner Trophy", "Runner-up Trophy", "Man of the Tournament Award"],
    },
    {
      slug: "quiz-competition",
      title: "Annual Quiz Competition 2025",
      date: "2025-11-20",
      description: "Test your knowledge in our annual quiz competition. Great prizes for winners!",
      category: "Education",
      location: "Community Hall",
      fullDescription: `Challenge your knowledge across various topics in our annual quiz competition. 
      This is a great opportunity for students and quiz enthusiasts to test their general knowledge and 
      compete for exciting prizes.`,
      rules: [
        "Individual or team participation (max 2 per team)",
        "Open to all ages",
        "Topics: General Knowledge, Current Affairs, Sports, Entertainment",
        "Registration fee: ₹100 per person",
      ],
      prizes: ["Winner: ₹5,000", "Runner-up: ₹3,000", "Third Place: ₹2,000"],
    },
    {
      slug: "ludo-championship",
      title: "Ludo Championship 2025",
      date: "2025-12-01",
      description: "Family-friendly ludo tournament. All ages welcome!",
      category: "Games",
      location: "GGF Center",
      fullDescription: `A fun family event where everyone can participate! Our Ludo Championship is designed 
      to bring families together for a day of friendly competition and entertainment.`,
      rules: [
        "Individual participation",
        "All ages welcome (under 12 with parent)",
        "Standard ludo rules apply",
        "Registration fee: ₹50 per person",
      ],
      prizes: ["Winner: ₹2,000", "Runner-up: ₹1,000"],
    },
  ];

  return events.find((e) => e.slug === slug);
};

export default function EventDetailPage({ params }) {
  const event = getEvent(params.slug);

  if (!event) {
    notFound();
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom">
        <Link href="/events" className="inline-flex items-center text-primary hover:underline mb-8">
          ← Back to Events
        </Link>

        {/* Event Header */}
        <div className="bg-gradient-to-r from-primary to-purple-900 text-white rounded-xl p-8 mb-8">
          <span className="bg-white text-primary px-4 py-1 rounded-full text-sm font-semibold mb-4 inline-block">
            {event.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>
          <div className="flex flex-wrap gap-6 text-lg">
            <div>📅 {formatDate(event.date)}</div>
            <div>📍 {event.location}</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">About This Event</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {event.fullDescription}
              </p>
            </div>

            {event.rules && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Rules & Guidelines</h2>
                <ul className="space-y-2">
                  {event.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2">✓</span>
                      <span className="text-gray-600">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {event.prizes && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">Prizes</h2>
                <ul className="space-y-2">
                  {event.prizes.map((prize, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent text-2xl mr-3">🏆</span>
                      <span className="text-gray-600 text-lg">{prize}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <RegistrationForm eventType="event" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
