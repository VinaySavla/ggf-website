import Image from "next/image";
import { Target, Users, Trophy, Heart, Award, Calendar } from "lucide-react";

export const metadata = {
  title: "About Us - GGF Community Portal",
  description: "Learn about Godhra Graduates Forum, our mission, vision, and the community we're building.",
};

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Mission",
      description: "To foster unity and development among graduates through educational, sports, and social activities that benefit our community.",
    },
    {
      icon: Users,
      title: "Community",
      description: "Building meaningful connections and supporting our members in their personal and professional growth journey.",
    },
    {
      icon: Trophy,
      title: "Excellence",
      description: "Promoting sportsmanship, fair play, and healthy competition through organized tournaments and events.",
    },
    {
      icon: Heart,
      title: "Service",
      description: "Contributing to society through charitable initiatives, educational programs, and community service.",
    },
  ];

  const milestones = [
    { year: "2020", event: "GGF Foundation established" },
    { year: "2021", event: "First Cricket Tournament organized" },
    { year: "2022", event: "Collaboration with Godhra Sports Club" },
    { year: "2023", event: "500+ registered members milestone" },
    { year: "2024", event: "Launch of GGF Community Portal" },
  ];

  return (
    <div className="py-12">
      <div className="container-custom">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About <span className="text-gradient">Godhra Graduates Forum</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are a community trust dedicated to bringing together graduates from Godhra
            and surrounding areas, united by our commitment to education, sports, and fellowship.
          </p>
        </div>

        {/* Logo and Partnership */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
          <div className="text-center">
            <div className="w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
              <Image
                src="/GGF.png"
                alt="GGF Logo"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
            <h3 className="font-semibold text-gray-900">Godhra Graduates Forum</h3>
          </div>
          <div className="text-center">
            <div className="w-40 h-40 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-4">
              <Image
                src="/GCS.png"
                alt="GSC Logo"
                width={120}
                height={120}
                className="object-contain"
              />
            </div>
            <h3 className="font-semibold text-gray-900">Godhra Sports Club</h3>
          </div>
        </div>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">Our Journey</h2>
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-200" />
              {milestones.map((milestone, index) => (
                <div key={index} className="relative pl-12 pb-8 last:pb-0">
                  <div className="absolute left-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-md">
                    <span className="text-sm font-semibold text-primary">{milestone.year}</span>
                    <p className="text-gray-900 mt-1">{milestone.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary to-purple-900 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-100 mb-6 max-w-2xl mx-auto">
            Be part of a growing community of graduates making a difference. Register today and stay connected with events, tournaments, and opportunities.
          </p>
          <a
            href="/register"
            className="inline-block bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            Register Now
          </a>
        </section>
      </div>
    </div>
  );
}
