import { Target, Users, Trophy, Heart } from "lucide-react";

export default function AboutSection() {
  const features = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To foster unity and development among graduates through educational, sports, and social activities.",
    },
    {
      icon: Users,
      title: "Community Building",
      description: "Creating meaningful connections and supporting our members in their personal and professional growth.",
    },
    {
      icon: Trophy,
      title: "Sports Excellence",
      description: "Organizing competitive tournaments to promote sportsmanship and physical fitness.",
    },
    {
      icon: Heart,
      title: "Social Impact",
      description: "Contributing to society through charitable initiatives and community service programs.",
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            About GGF
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            The Godhra Graduates Forum is a community trust dedicated to bringing together
            graduates from Godhra and surrounding areas. We believe in the power of community
            and strive to create opportunities for growth and connection.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-50 text-primary mb-4">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
