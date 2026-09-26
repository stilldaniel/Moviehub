"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight, Clapperboard, Heart, History, Home, LogOut, Menu, Search, Sparkles, Trophy, User as UserIcon, X,
} from "lucide-react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import ZoraLogo from "@/components/brand/ZoraLogo";
import Button from "@/components/ui/Button";
import { containerClasses } from "@/components/ui/Container";
import { easeSoft } from "@/components/MotionProvider";
import { getSafeSession, supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movie", label: "Movies", icon: Clapperboard },
  { href: "/anime", label: "Anime", icon: Sparkles },
  { href: "/sports", label: "Sports", icon: Trophy },
];

const ACCOUNT_LINKS = [
  { href: "/profile", label: "My profile", icon: UserIcon },
  { href: "/favorites", label: "My favorites", icon: Heart },
  { href: "/history", label: "Watch history", icon: History },
];

const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  const initial = (user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase();
  const url = user.user_metadata?.avatar_url;
  return url ? (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      width={size}
      height={size}
      className="shrink-0 rounded-full object-cover ring-2 ring-brand"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold"
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}

function SearchForm({ onSubmit, className, inputClassName }: { onSubmit: (q: string) => void; className?: string; inputClassName?: string }) {
  const [query, setQuery] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit(query.trim());
    setQuery("");
  };
  return (
    <form role="search" onSubmit={submit} className={cn("flex items-center rounded-xl bg-surface-raised/80 ring-1 ring-inset ring-line transition focus-within:ring-2 focus-within:ring-brand/70", className)}>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search movies, shows, anime…"
        aria-label="Search movies, shows and anime"
        enterKeyHint="search"
        className={cn("min-w-0 flex-1 bg-transparent px-4 py-2 text-sm text-fg placeholder:text-fg-subtle outline-none", inputClassName)}
      />
      <button type="submit" aria-label="Search" className="px-3 py-2 text-fg-muted transition hover:text-fg cursor-pointer">
        <Search size={16} />
      </button>
    </form>
  );
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  // Close menus after navigating (adjusting state during render, not in an effect)
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    getSafeSession(supabase.auth).then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) =>
      setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Mobile menu: lock page scroll, close on Escape, move focus into the panel
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    menuPanelRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [menuOpen]);

  // Desktop account dropdown: close on Escape or a click outside it
  useEffect(() => {
    if (!dropdownOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDropdownOpen(false); };
    const onClick = (e: MouseEvent) => { if (!dropdownRef.current?.contains(e.target as Node)) setDropdownOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onClick); };
  }, [dropdownOpen]);

  const search = (q: string) => {
    setMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setDropdownOpen(false);
    router.replace("/auth/login");
    router.refresh();
  };

  if (pathname.startsWith("/auth")) return null;

  const solid = scrolled || menuOpen;
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";

  return (
    <>
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        solid
          ? "bg-canvas/95 backdrop-blur-xl border-b border-line"
          : "border-b border-transparent bg-linear-to-b from-black/70 to-transparent"
      )}
    >
      <div className={cn(containerClasses, "flex h-16 md:h-[72px] items-center justify-between gap-6")}>
        <Link href="/" className="shrink-0 rounded-md" aria-label="Zora Stream home">
          <span className="md:hidden"><ZoraLogo size={28} /></span>
          <span className="hidden md:inline"><ZoraLogo size={34} /></span>
        </Link>

        {/* Desktop navigation */}
        <nav aria-label="Main" className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "text-fg" : "text-fg-muted hover:text-fg"
                )}
              >
                {link.label}
                {active && <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <SearchForm onSubmit={search} className="hidden md:flex w-56 lg:w-64" />

          {/* Desktop account */}
          {user ? (
            <div ref={dropdownRef} className="relative hidden md:block">
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full p-0.5 cursor-pointer"
              >
                <Avatar user={user} />
                <span className="hidden lg:block max-w-32 truncate text-sm text-fg-soft">{displayName.split(" ")[0]}</span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: easeSoft }}
                    className="absolute right-0 top-12 w-64 origin-top-right overflow-hidden rounded-2xl bg-surface ring-1 ring-line shadow-2xl shadow-black/60"
                  >
                    <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                      <Avatar user={user} size={36} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        <p className="truncate text-xs text-fg-muted">{user.email}</p>
                      </div>
                    </div>
                    <div className="p-1.5">
                      {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-soft transition hover:bg-white/5 hover:text-fg">
                          <Icon size={16} className="text-fg-subtle" /> {label}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-line p-1.5">
                      <button role="menuitem" onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger transition hover:bg-danger/10 cursor-pointer">
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button href="/auth/login" variant="ghost" size="sm">Sign in</Button>
              <Button href="/auth/signup" size="sm">Sign up</Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden -mr-2 flex h-10 w-10 items-center justify-center rounded-xl text-fg transition hover:bg-white/5 cursor-pointer"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

    </header>

    {/* Rendered outside <header>: its backdrop-filter would otherwise trap this fixed panel inside it */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuPanelRef}
            tabIndex={-1}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: easeSoft }}
            className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[55] overflow-y-auto overscroll-contain bg-canvas outline-none"
          >
            <div className={cn(containerClasses, "flex min-h-full flex-col gap-6 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]")}>
              <SearchForm onSubmit={search} inputClassName="py-3 text-base" />

              <nav aria-label="Main" className="grid grid-cols-2 gap-2.5">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col gap-3 rounded-2xl p-4 ring-1 ring-inset transition active:scale-[0.98]",
                        active ? "bg-brand/12 ring-brand/40 text-fg" : "bg-surface ring-line text-fg-soft"
                      )}
                    >
                      <Icon size={22} className={active ? "text-brand" : "text-fg-muted"} />
                      <span className="text-base font-semibold">{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {user ? (
                <section aria-label="Your account" className="overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
                  <div className="flex items-center gap-3 border-b border-line p-4">
                    <Avatar user={user} size={44} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{displayName}</p>
                      <p className="truncate text-sm text-fg-muted">{user.email}</p>
                    </div>
                  </div>
                  <ul className="divide-y divide-line">
                    {ACCOUNT_LINKS.map(({ href, label, icon: Icon }) => (
                      <li key={href}>
                        <Link href={href} className="flex items-center gap-3 px-4 py-3.5 text-fg-soft transition active:bg-white/5">
                          <Icon size={18} className="text-fg-muted" />
                          <span className="flex-1">{label}</span>
                          <ChevronRight size={16} className="text-fg-subtle" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Button href="/auth/login" variant="secondary" size="lg">Sign in</Button>
                  <Button href="/auth/signup" size="lg">Create account</Button>
                </div>
              )}

              {user && (
                <Button variant="secondary" size="lg" className="mt-auto w-full text-danger" icon={<LogOut size={16} />} onClick={signOut}>
                  Sign out
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
