"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  ClipboardList, 
  UserCog,
  Trophy,
  Settings,
  LogOut,
  X,
  Menu,
  Dumbbell,
  BarChart3,
  Images,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";

export default function AdminSidebar({ userRole }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    events: true,
    users: true,
    settings: true,
  });

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  // Navigation structure with hierarchy
  const navStructure = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    {
      label: "Events",
      icon: Calendar,
      key: "events",
      children: [
        { href: "/admin/events", label: "All Events", icon: Calendar },
        { href: "/admin/registrations", label: "Registrations", icon: ClipboardList },
        { href: "/admin/teams", label: "Teams", icon: Trophy },
      ],
    },
  ];

  // Super Admin only items - Users and Gallery
  if (userRole === "SUPER_ADMIN") {
    navStructure.push(
      {
        label: "Users",
        icon: Users,
        key: "users",
        children: [
          { href: "/admin/user", label: "All Users", icon: Users },
          { href: "/admin/stats", label: "Users Stats", icon: BarChart3 },
        ],
      },
      { href: "/admin/gallery", label: "Gallery", icon: Images },
      {
        label: "Settings",
        icon: Settings,
        key: "settings",
        children: [
          { href: "/admin/sports", label: "Sports", icon: Dumbbell },
          { href: "/admin/users", label: "User Creation", icon: UserCog },
          { href: "/admin/settings", label: "Site Settings", icon: Settings },
        ],
      }
    );
  }

  const isActive = (href) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const isParentActive = (children) => {
    return children?.some(child => isActive(child.href));
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Close Button (Mobile) */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-4 right-4"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/admin" className="flex items-center space-x-3">
            <Image
              src="/GGF.png"
              alt="GGF Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <span className="font-bold text-gray-900">GGF Admin</span>
              <span className="block text-xs text-gray-500">
                {userRole === "SUPER_ADMIN" ? "Super Admin" : "Organizer"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <ul className="space-y-1">
            {navStructure.map((item) => (
              <li key={item.href || item.key}>
                {/* Regular menu item */}
                {item.href && !item.children && (
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )}

                {/* Parent menu with children */}
                {item.children && (
                  <div>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        isParentActive(item.children)
                          ? "bg-primary/10 text-primary"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {expandedMenus[item.key] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Children */}
                    {expandedMenus[item.key] && (
                      <ul className="mt-1 ml-4 pl-4 border-l border-gray-200 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                                isActive(child.href)
                                  ? "bg-primary text-white"
                                  : "text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              <child.icon className="w-4 h-4" />
                              <span>{child.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-gray-100">
          <Link
            href="/"
            className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="font-medium">← Back to Site</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
