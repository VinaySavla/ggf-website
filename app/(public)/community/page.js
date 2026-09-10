import Link from "next/link";
import { Users, GraduationCap, Briefcase, Building2, HeartHandshake, Megaphone } from "lucide-react";

export const metadata = { title: "GGF Community" };
export default function CommunityPage() {
  const items = [
    [Users, "Member directory", "Discover graduates by profession, village and skills.", "/directory"],
    [GraduationCap, "Mentorship", "Request guidance or support another graduate.", "/mentorship"],
    [Briefcase, "Opportunities", "Jobs, internships, scholarships and admissions.", "/opportunities"],
    [Building2, "Business directory", "Trusted services and businesses within the community.", "/businesses"],
    [HeartHandshake, "Volunteer", "Contribute time and skills to GGF initiatives.", "/volunteer"],
    [Megaphone, "Announcements", "Important organization and event updates.", "/announcements"],
  ];
  return <div className="py-14 bg-gray-50 min-h-screen"><div className="container-custom"><div className="max-w-2xl"><p className="text-primary font-semibold">More than events</p><h1 className="text-4xl font-bold mt-2">The GGF graduate community</h1><p className="text-gray-600 mt-4">Connect through careers, mentorship, service, business and lifelong participation.</p></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">{items.map(([Icon,title,description,href]) => <Link key={href} href={href} className="bg-white border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition"><Icon className="w-9 h-9 text-primary"/><h2 className="font-bold text-xl mt-5">{title}</h2><p className="text-gray-600 mt-2">{description}</p><span className="text-primary font-medium inline-block mt-5">Explore →</span></Link>)}</div></div></div>;
}
