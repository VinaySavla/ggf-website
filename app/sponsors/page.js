"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);

  // Sample sponsors - replace with Directus API
  const sampleSponsors = [
    {
      id: 1,
      name: "Ramesh Patel",
      photo: null,
      description: "Supporting education and sports initiatives",
      contribution: "Gold Sponsor",
    },
    {
      id: 2,
      name: "Suresh Industries",
      photo: null,
      description: "Proud supporter of community development",
      contribution: "Silver Sponsor",
    },
    {
      id: 3,
      name: "Mehta Brothers",
      photo: null,
      description: "Committed to youth empowerment",
      contribution: "Gold Sponsor",
    },
  ];

  useEffect(() => {
    // Replace with actual API call
    // setSponsors(sampleSponsors);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-purple-900 text-white py-16">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Sponsors</h1>
          <p className="text-xl">
            Thank you to our generous sponsors who make our community events possible!
          </p>
        </div>
      </section>

      {/* Sponsors Grid */}
      <section className="py-16">
        <div className="container-custom">
          {sponsors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                >
                  <div className="relative h-64 bg-gray-200">
                    {sponsor.photo ? (
                      <Image
                        src={sponsor.photo}
                        alt={sponsor.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-6xl">
                        🤝
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{sponsor.name}</h3>
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {sponsor.contribution}
                      </span>
                    </div>
                    <p className="text-gray-600">{sponsor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 mb-16">
              <div className="text-6xl mb-4">🤝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Sponsorships Open!
              </h2>
              <p className="text-gray-600 text-lg">
                Be the first to support our community events. Your photo will be featured here!
              </p>
            </div>
          )}

          {/* Become a Sponsor Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12" id="contact">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                Become a Sponsor
              </h2>
              <p className="text-gray-600 text-center mb-8">
                Support our community initiatives and gain recognition. Your contribution helps us
                organize events that benefit education, sports, health, and environment.
              </p>

              {/* Sponsorship Tiers */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="border-2 border-yellow-500 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">🥇</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Gold Sponsor</h3>
                  <p className="text-2xl font-bold text-primary mb-2">₹1,00,000+</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Logo on all materials</li>
                    <li>Featured on website</li>
                    <li>Social media recognition</li>
                    <li>VIP event access</li>
                  </ul>
                </div>

                <div className="border-2 border-gray-400 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">🥈</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Silver Sponsor</h3>
                  <p className="text-2xl font-bold text-primary mb-2">₹50,000+</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Logo on materials</li>
                    <li>Website listing</li>
                    <li>Social media mention</li>
                    <li>Event invitations</li>
                  </ul>
                </div>

                <div className="border-2 border-orange-600 rounded-lg p-6 text-center">
                  <div className="text-4xl mb-2">🥉</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Bronze Sponsor</h3>
                  <p className="text-2xl font-bold text-primary mb-2">₹25,000+</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Website listing</li>
                    <li>Social media mention</li>
                    <li>Event recognition</li>
                    <li>Thank you certificate</li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center text-gray-600">
                    <span className="text-2xl mr-3">📧</span>
                    <span>sponsors@ggfgodhra.com</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="text-2xl mr-3">📞</span>
                    <span>+91 9876543210</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="text-2xl mr-3">📍</span>
                    <span>Godhra Graduates Forum, Godhra, Gujarat</span>
                  </div>
                </div>
                <div className="mt-6">
                  <a
                    href="mailto:sponsors@ggfgodhra.com"
                    className="block w-full bg-primary text-white text-center px-6 py-3 rounded-lg hover:bg-opacity-90 transition font-semibold"
                  >
                    Contact Us for Sponsorship
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
