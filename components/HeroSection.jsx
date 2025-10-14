import Link from "next/link";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-primary to-purple-900 text-white py-20">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome to <span className="text-yellow-300">Godhra Graduates Forum</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 leading-relaxed text-gray-100">
              Building community through education, sports, and fellowship. Join us in making a
              positive impact in Godhra and beyond.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/tournament"
                className="bg-accent hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold text-center transition"
              >
                Cricket Tournament
              </Link>
              <Link
                href="/events"
                className="bg-white text-primary hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-center transition"
              >
                View All Events
              </Link>
            </div>
          </div>

          {/* Logo/Image */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-white rounded-full p-8 shadow-2xl flex items-center justify-center">
              <Image
                src="/GGF.png"
                alt="GGF Logo"
                width={280}
                height={280}
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
