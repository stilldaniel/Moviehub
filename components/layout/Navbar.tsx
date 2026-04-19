"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/movie", label: "Movies" },
    { href: "/anime", label: "Anime" },
    { href: "/favorites", label: "Favorites" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-100 transition-all duration-500 ${
        isScrolled ? "bg-black/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-red-500 text-xl font-bold shrink-0">
          MovieApp
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition ${
                pathname === link.href
                  ? "text-white font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Search */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center bg-black/40 border border-gray-700 rounded-full overflow-hidden focus-within:border-red-500 transition">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="bg-transparent text-sm text-white placeholder-gray-500 px-4 py-1.5 outline-none w-48"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-3 py-1.5 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <Search size={16} />
            </button>
          </div>
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            M
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white text-2xl"
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/95 px-6 py-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`text-sm transition ${
                pathname === link.href
                  ? "text-white font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Search */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center bg-black/40 border border-gray-700 rounded-full overflow-hidden focus-within:border-red-500 transition">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="bg-transparent text-sm text-white placeholder-gray-500 px-4 py-2 outline-none flex-1"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-3 py-2 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <Search size={16} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSearch}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 rounded-full transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}