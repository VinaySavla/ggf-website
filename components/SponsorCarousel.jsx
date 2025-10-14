"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SponsorCarousel({ sponsors = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (sponsors.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % sponsors.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [sponsors.length]);

  if (sponsors.length === 0) {
    return (
      <section className="bg-gray-50 py-12">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Our Sponsors
          </h2>
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-2xl font-semibold text-primary mb-4">
              Sponsorships Open!
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              Your photo could be featured here. Support our community events and get recognized.
            </p>
            <a
              href="#contact"
              className="inline-block bg-primary text-white px-8 py-3 rounded-full hover:bg-opacity-90 transition"
            >
              Become a Sponsor
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 py-12">
      <div className="container-custom">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Our Valued Sponsors
        </h2>
        
        {/* Carousel */}
        <div className="relative overflow-hidden rounded-xl shadow-lg bg-white">
          <div className="flex transition-transform duration-500 ease-in-out"
               style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {sponsors.map((sponsor, index) => (
              <div key={sponsor.id || index} className="min-w-full flex flex-col items-center justify-center p-12">
                <div className="relative w-48 h-48 mb-4 rounded-full overflow-hidden border-4 border-primary">
                  {sponsor.photo ? (
                    <Image
                      src={sponsor.photo}
                      alt={sponsor.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                      No Photo
                    </div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{sponsor.name}</h3>
                {sponsor.description && (
                  <p className="text-gray-600 text-center max-w-md">{sponsor.description}</p>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 pb-4">
            {sponsors.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentIndex ? "bg-primary" : "bg-gray-300"
                }`}
                aria-label={`Go to sponsor ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
