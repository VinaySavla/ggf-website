import { Users, Calendar, Trophy, Award } from "lucide-react";

export default function StatsSection() {
  const stats = [
    { icon: Users, value: "500+", label: "Registered Players" },
    { icon: Calendar, value: "50+", label: "Events Organized" },
    { icon: Trophy, value: "20+", label: "Tournaments Held" },
    { icon: Award, value: "100+", label: "Awards Given" },
  ];

  return (
    <section className="py-16 bg-gradient-to-r from-primary to-purple-900 text-white">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
                <stat.icon className="w-8 h-8" />
              </div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-gray-200 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
