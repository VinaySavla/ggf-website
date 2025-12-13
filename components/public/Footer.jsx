import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image 
                src="/GGF.png" 
                alt="GGF Logo" 
                width={40} 
                height={40}
                className="object-contain"
              />
              <h3 className="text-xl font-bold text-white">Godhra Graduates Forum</h3>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              A community trust dedicated to organizing educational, sports, and fellowship events.
              Building community through education, sports, and togetherness.
            </p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">In collaboration with</span>
              <Image 
                src="/GCS.png" 
                alt="GSC Logo" 
                width={30} 
                height={30}
                className="object-contain"
              />
              <span className="text-xs text-gray-400">Godhra Sports Club</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-primary transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-primary transition">
                  Gallery
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>godharagraduatesforum@gmail.com</span>
              </li>
            </ul>
            
            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition">
                <Instagram className="w-5 h-5" />
              </a>
              {/* <a href="#" className="text-gray-400 hover:text-primary transition">
                <Twitter className="w-5 h-5" />
              </a> */}
              <a href="#" className="text-gray-400 hover:text-red-500 transition">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© {currentYear} Godhra Graduates Forum. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
