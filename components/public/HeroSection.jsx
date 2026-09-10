import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, HeartHandshake } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="home-hero border-b border-primary/10 py-16 lg:py-24">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <p className="eyebrow mb-6">Godhra Graduates Forum</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 leading-[1.12] text-primary-900">
              A community to belong to.<br/><span className="text-primary">A place to grow.</span>
            </h1>
            <p className="text-base sm:text-lg mb-8 leading-8 text-gray-600">
              Play, learn, give back, and connect. Discover opportunities in Godhra and keep your events, achievements, and community contributions together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/events"
                className="btn-primary inline-flex items-center justify-center gap-3"
              >
                Explore events <ArrowRight className="w-4 h-4" aria-hidden="true"/>
              </Link>
              <Link
                href="/about"
                className="btn-secondary text-center"
              >
                Get to know GGF
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600"><span className="inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-primary"/>Sports & events</span><span className="inline-flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-primary"/>Service & belonging</span></div>
          </div>

          {/* Logo/Image */}
          <div className="flex justify-center">
            <div className="w-full max-w-sm bg-white/90 rounded-[2rem] border border-white p-8 shadow-[0_24px_80px_-40px_rgba(72,19,105,0.4)] text-center">
              <p className="border-b border-primary/10 pb-5 text-sm font-semibold text-primary-900">Your community. Your journey.</p>
              <Image
                src="/GGF.png"
                alt="GGF Logo"
                width={180}
                height={180}
                className="object-contain mx-auto my-8"
                priority
              />
              <p className="text-lg font-semibold text-primary-900">Every contribution counts.</p>
              <p className="mt-2 text-sm leading-6 text-gray-600">One member profile for your sports record, skills, certificates, and service.</p>
              <Link href="/community" className="mt-6 flex items-center justify-between rounded-xl bg-primary-50 p-4 text-sm font-semibold text-primary-800">Explore the community<ArrowRight className="w-4 h-4"/></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
