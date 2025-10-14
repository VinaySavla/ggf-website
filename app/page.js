import HeroSection from "@/components/HeroSection";
import SponsorCarousel from "@/components/SponsorCarousel";
import UpcomingEvents from "@/components/UpcomingEvents";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <SponsorCarousel />
      
      {/* About GGF Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-6 mb-6">
              <Image 
                src="/GGF.png" 
                alt="GGF Logo" 
                width={80} 
                height={80}
                className="object-contain"
              />
              <span className="text-2xl text-gray-400">×</span>
              <Image 
                src="/GCS.png" 
                alt="GSC Logo" 
                width={80} 
                height={80}
                className="object-contain"
              />
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4">About Godhra Graduates Forum</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              GGF is a community trust dedicated to fostering growth, education, and fellowship in Godhra and surrounding areas.
              <br />
              <span className="text-sm text-primary font-semibold mt-2 block">In collaboration with Godhra Sports Club</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Education</h3>
              <p className="text-gray-600">Organizing quiz competitions, workshops, and educational programs to promote learning and knowledge sharing.</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Fellowship</h3>
              <p className="text-gray-600">Building strong community bonds through social gatherings, cultural events, and networking opportunities.</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">🏥</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Medical</h3>
              <p className="text-gray-600">Supporting health initiatives, blood donation camps, and medical awareness programs for the community.</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">⚽</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Sports</h3>
              <p className="text-gray-600">Hosting cricket tournaments, ludo championships, and other sporting events in collaboration with Godhra Sports Club.</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">🌱</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Environment</h3>
              <p className="text-gray-600">Promoting environmental awareness through tree plantation drives and sustainability initiatives.</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-8 text-center hover:shadow-lg transition">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Community</h3>
              <p className="text-gray-600">Strengthening our community through various social initiatives and support programs for all age groups.</p>
            </div>
          </div>
        </div>
      </section>

      <UpcomingEvents />

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-primary to-purple-900 text-white py-16">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Be part of something bigger. Participate in our events, volunteer, or become a sponsor.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tournament" className="bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
              Register for Tournament
            </Link>
            <Link href="/sponsors" className="bg-accent text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-700 transition">
              Become a Sponsor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
