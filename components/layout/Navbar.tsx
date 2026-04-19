"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchQuery("");
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/movie", label: "Movies" },
    { href: "/anime", label: "Anime" },
    { href: "/favorites", label: "Favorites" },
  ];

  const userInitial =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const isAuthPage = pathname?.startsWith("/auth");

  if (isAuthPage) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link href="/" className="text-red-500 text-xl md:text-2xl font-bold shrink-0">
          MovieApp
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition text-sm ${
                pathname === link.href
                  ? "text-red-500 font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Desktop Search */}
          <div className="hidden md:flex items-center bg-gray-900/80 border border-gray-700 rounded-lg overflow-hidden focus-within:border-red-500 transition">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="bg-transparent px-4 py-2 outline-none text-sm text-white placeholder-gray-500 w-48"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>

          {/* User Avatar / Auth Buttons */}
          {user ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border-2 border-red-600"
                  />
                ) : (
                  <div className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-sm font-bold transition">
                    {userInitial}
                  </div>
                )}
                <span className="text-sm text-gray-300 hidden lg:block">
                  {user.user_metadata?.full_name?.split(" ")[0] ||
                    user.email?.split("@")[0]}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-52 bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {userInitial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    My Favorites
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    Watch History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition cursor-pointer border-t border-gray-700"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-sm text-gray-300 hover:text-white transition px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg transition"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-2xl text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <HiX size={26} /> : <HiMenu size={26} />}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden flex flex-col gap-4 px-6 pb-6 bg-black/95 backdrop-blur-md">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm transition py-1 border-b border-gray-800 ${
                pathname === link.href
                  ? "text-red-500 font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Search */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg overflow-hidden focus-within:border-red-500 transition">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="bg-transparent px-4 py-2 outline-none text-sm text-white placeholder-gray-500 flex-1"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <Search size={16} />
              </button>
            </div>
            <button
              onClick={handleSearch}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-lg transition cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Mobile Auth */}
          {user ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-800">
              <div className="flex items-center gap-3 py-2">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border-2 border-red-600"
                  />
                ) : (
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userInitial}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              </div>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white transition py-1">My Profile</Link>
              <Link href="/favorites" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white transition py-1">My Favorites</Link>
              <Link href="/history" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white transition py-1">Watch History</Link>
              <button
                onClick={handleLogout}
                className="text-left text-sm text-red-400 hover:text-red-300 transition py-1 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2 border-t border-gray-800">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-gray-600 hover:border-white text-gray-300 hover:text-white py-2 rounded-lg transition">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}