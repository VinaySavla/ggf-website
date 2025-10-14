"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <Image 
              src="/GGF.png" 
              alt="GGF Logo" 
              width={50} 
              height={50}
              className="object-contain"
            />
            <span className="hidden sm:block text-sm font-medium text-gray-700">
              Godhra Graduates Forum
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary transition">
              Home
            </Link>
            <Link href="/tournament" className="text-gray-700 hover:text-primary transition">
              Tournament
            </Link>
            <Link href="/auction/live" className="text-gray-700 hover:text-primary transition">
              Auction
            </Link>
            <Link href="/teams" className="text-gray-700 hover:text-primary transition">
              Teams
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-primary transition">
              Events
            </Link>
            <Link href="/sponsors" className="text-gray-700 hover:text-primary transition">
              Sponsors
            </Link>
            <Link 
              href="/tournament/register" 
              className="bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition"
            >
              Register
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3">
            <Link 
              href="/" 
              className="block text-gray-700 hover:text-primary transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/tournament" 
              className="block text-gray-700 hover:text-primary transition"
              onClick={() => setIsOpen(false)}
            >
              Tournament
            </Link>
            <Link 
              href="/auction/live" 
              className="block text-gray-700 hover:text-primary transition"
              onClick={() => setIsOpen(false)}
            >
              Auction
            </Link>
            <Link 
              href="/teams" 
              className="block text-gray-700 hover:text-primary transition"
              onClick={() => setIsOpen(false)}
            >
              Teams
            </Link>
            <Link 
              href="/events" 
              className="block text-gray-700 hover:text-primary transition"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link 
              href="/sponsors" 
              className="block text-gray-700 hover:text-primary transition"
              onClick={() => setIsOpen(false)}
            >
              Sponsors
            </Link>
            <Link 
              href="/tournament/register" 
              className="block bg-primary text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition text-center"
              onClick={() => setIsOpen(false)}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
