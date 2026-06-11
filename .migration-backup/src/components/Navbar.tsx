"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  List,
  Columns2,
  LogOut,
  BriefcaseBusiness,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: List },
  { href: "/kanban", label: "Kanban", icon: Columns2 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
              <BriefcaseBusiness className="w-6 h-6 text-indigo-600" />
              <span>JobTracker</span>
            </Link>
            <div className="hidden sm:flex gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith(href)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-md hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-gray-100 flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
              pathname.startsWith(href)
                ? "text-indigo-700 bg-indigo-50"
                : "text-gray-600"
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
