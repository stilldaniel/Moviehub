"use client";

import Link from "next/link";
import ZoraLogo from "@/components/brand/ZoraLogo";
import { containerClasses } from "@/components/ui/Container";
import { useState, useEffect } from "react";
import { HiMenu, HiX } from "react-icons/hi";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { supabase, getSafeSession } from "@/lib/supabase";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

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
      const { data: { session } } = await getSafeSession(supabase.auth);
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
    { href: "/sports", label: "Sports" },
    // Favorites lives in the account menu
  ];

  const userInitial =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const isAuthPage = pathname?.startsWith("/auth");

  if (!mounted) {
    return null;
  }

  if (isAuthPage) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/90 backdrop-blur-md shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className={`${containerClasses} flex items-center justify-between py-4`}>

        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="Zora Stream home">
          {/* Wrappers carry the breakpoints; the logo itself is always inline-flex */}
          <span className="md:hidden"><ZoraLogo size={28} /></span>
          <span className="hidden md:inline"><ZoraLogo size={34} /></span>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition text-sm ${
                pathname === link.href
                  ? "text-brand font-semibold"
                  : "text-fg-soft hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Desktop Search */}
          <div className="hidden md:flex items-center bg-surface/80 border border-line rounded-lg overflow-hidden focus-within:border-brand transition">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="bg-transparent px-4 py-2 outline-none text-sm text-white placeholder-fg-subtle w-48"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 text-fg-muted hover:text-white transition cursor-pointer"
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
                    className="w-9 h-9 rounded-full object-cover border-2 border-brand"
                  />
                ) : (
                  <div className="w-9 h-9 bg-brand hover:bg-brand-hover rounded-full flex items-center justify-center text-white text-sm font-bold transition">
                    {userInitial}
                  </div>
                )}
                <span className="text-sm text-fg-soft hidden lg:block">
                  {user.user_metadata?.full_name?.split(" ")[0] ||
                    user.email?.split("@")[0]}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-52 bg-surface-raised border border-line rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-line flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Profile"
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {userInitial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.user_metadata?.full_name || "User"}
                      </p>
                      <p className="text-xs text-fg-muted truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-fg-soft hover:text-white hover:bg-white/5 transition"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-fg-soft hover:text-white hover:bg-white/5 transition"
                  >
                    My Favorites
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2.5 text-sm text-fg-soft hover:text-white hover:bg-white/5 transition"
                  >
                    Watch History
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger hover:text-danger hover:bg-white/5 transition cursor-pointer border-t border-line"
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
                className="text-sm text-fg-soft hover:text-white transition px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm bg-brand hover:bg-brand-hover text-white px-4 py-1.5 rounded-lg transition"
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
        <div className={`${containerClasses} md:hidden flex flex-col gap-4 pb-6 bg-black/95 backdrop-blur-md`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm transition py-1 border-b border-line ${
                pathname === link.href
                  ? "text-brand font-semibold"
                  : "text-fg-soft hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Search */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center bg-surface border border-line rounded-lg overflow-hidden focus-within:border-brand transition">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="bg-transparent px-4 py-2 outline-none text-sm text-white placeholder-fg-subtle flex-1"
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 text-fg-muted hover:text-white transition cursor-pointer"
              >
                <Search size={16} />
              </button>
            </div>
            <button
              onClick={handleSearch}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-medium py-2 rounded-lg transition cursor-pointer"
            >
              Search
            </button>
          </div>

          {/* Mobile Auth */}
          {user ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-line">
              <div className="flex items-center gap-3 py-2">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover border-2 border-brand"
                  />
                ) : (
                  <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {userInitial}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                  <p className="text-xs text-fg-muted">{user.email}</p>
                </div>
              </div>
              <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-fg-soft hover:text-white transition py-1">My Profile</Link>
              <Link href="/favorites" onClick={() => setMenuOpen(false)} className="text-sm text-fg-soft hover:text-white transition py-1">My Favorites</Link>
              <Link href="/history" onClick={() => setMenuOpen(false)} className="text-sm text-fg-soft hover:text-white transition py-1">Watch History</Link>
              <button
                onClick={handleLogout}
                className="text-left text-sm text-danger hover:text-danger transition py-1 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2 border-t border-line">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm border border-line-strong hover:border-white text-fg-soft hover:text-white py-2 rounded-lg transition">Sign In</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-brand hover:bg-brand-hover text-white py-2 rounded-lg transition">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}