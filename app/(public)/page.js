import HeroSection from "@/components/public/HeroSection";
import FeaturedEvents from "@/components/public/FeaturedEvents";
import AboutSection from "@/components/public/AboutSection";
import StatsSection from "@/components/public/StatsSection";

// Force dynamic rendering since we fetch from database
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedEvents />
      <AboutSection />
      <StatsSection />
    </>
  );
}
