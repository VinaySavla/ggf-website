"use client";

import { useState, useEffect } from "react";
import EventCard from "@/components/EventCard";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  // Sample events - replace with Directus API
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
    {
      id: 4,
      title: "Blood Donation Camp",
      date: "2025-12-10",
      description: "Give the gift of life. Join our blood donation drive.",
      category: "Medical",
      location: "Godhra Hospital",
      slug: "blood-donation",
    },
    {
      id: 5,
      title: "Tree Plantation Drive",
      date: "2025-12-15",
      description: "Help make Godhra greener. Plant trees with us!",
      category: "Environment",
      location: "Various Locations",
      slug: "tree-plantation",
    },
    {
      id: 6,
      title: "Fellowship Dinner",
      date: "2025-12-25",
      description: "Community dinner and networking event. Bring your family!",
      category: "Fellowship",
      location: "Banquet Hall",
      slug: "fellowship-dinner",
    },
  ];

  useEffect(() => {
    setEvents(sampleEvents);
  }, []);

  const categories = ["all", "Sports", "Education", "Games", "Medical", "Environment", "Fellowship"];
  
  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.category === filter);

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">All Events</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover upcoming events organized by Godhra Graduates Forum. From sports to education,
            there's something for everyone!
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-2 rounded-full font-semibold transition ${
                filter === category
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {category === "all" ? "All Events" : category}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-12">No events found in this category.</p>
        )}
      </div>
    </div>
  );
}
