"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, SlidersHorizontal, X } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { containerClasses } from "@/components/ui/Container";

function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function MovieCardSkeleton() {
  return (
    <div className="w-full rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-2/3 bg-surface-raised rounded-xl" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className={`${containerClasses} flex gap-8 py-8`}>
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-56 self-start rounded-2xl bg-surface ring-1 ring-line p-5 shrink-0">
        <div className="h-5 w-24 bg-control rounded animate-pulse mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-3 w-16 bg-control rounded animate-pulse mb-3" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 w-20 bg-surface-raised rounded animate-pulse mb-2" />
            ))}
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="flex-1 min-w-0">
        <div className="h-6 w-32 bg-surface-raised rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-2 sm:gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnimePage() {
  const [anime, setAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [heroBg, setHeroBg] = useState("");

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [showTop, setShowTop] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  const debouncedYear = useDebounce(selectedYear, 400);
  const debouncedRating = useDebounce(selectedRating, 400);
  const debouncedType = useDebounce(selectedType, 400);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchHero = async () => {
      const res = await fetch(`/api/tmdb/tv/52698`);
      const data = await res.json();
      if (data.backdrop_path) {
        setHeroBg(`https://image.tmdb.org/t/p/w1280${data.backdrop_path}`);
      }
    };
    fetchHero();
  }, []);

  useEffect(() => {
    const fetchAnime = async () => {
      if (page === 1) setInitialLoading(true);
      else setLoading(true);

      const mediaType = selectedType === "TV" ? "tv" : "movie";
      let url = `/api/tmdb/discover/${mediaType}?with_genres=16&with_keywords=210024&sort_by=popularity.desc&page=${page}`;

      if (debouncedYear !== "All") {
        url += mediaType === "movie"
          ? `&primary_release_year=${debouncedYear}`
          : `&first_air_date_year=${debouncedYear}`;
      }
      if (debouncedRating !== "All") url += `&vote_average.gte=${debouncedRating}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.results || data.results.length === 0) {
        setHasMore(false);
      } else {
        setAnime((prev) => {
          const combined = page === 1 ? data.results : [...prev, ...data.results];
          const unique = Array.from(new Map(combined.map((m: any) => [m.id, m])).values());
          return unique;
        });
      }

      setInitialLoading(false);
      setLoading(false);
    };

    fetchAnime();
  }, [page, debouncedYear, debouncedRating, debouncedType]);

  useEffect(() => {
    setAnime([]);
    setPage(1);
    setHasMore(true);
  }, [debouncedYear, debouncedRating, debouncedType]);

  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const lastAnimeRef = (node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
    });
    if (node) observer.current.observe(node);
  };

  const clearFilters = () => {
    setSelectedYear("All");
    setSelectedRating("All");
    setSelectedType("All");
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const FilterContent = () => (
    <>
      <div className="mb-6">
        <h3 className="text-fg-muted text-sm uppercase tracking-wider mb-3">Type</h3>
        {["All", "Movie", "TV"].map((type) => (
          <p
            key={type}
            onClick={() => { setSelectedType(type); setSidebarOpen(false); }}
            className={`cursor-pointer mb-1.5 text-sm ${selectedType === type ? "text-brand font-medium" : "text-fg-soft hover:text-white"}`}
          >
            {type === "All" ? "All" : type === "Movie" ? "Anime Movies" : "Anime Series"}
          </p>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-fg-muted text-sm uppercase tracking-wider mb-3">Year</h3>
        {["All", "2024", "2023", "2022", "2021", "2020"].map((year) => (
          <p
            key={year}
            onClick={() => { setSelectedYear(year); setSidebarOpen(false); }}
            className={`cursor-pointer mb-1.5 text-sm ${selectedYear === year ? "text-brand font-medium" : "text-fg-soft hover:text-white"}`}
          >
            {year}
          </p>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-fg-muted text-sm uppercase tracking-wider mb-3">Rating</h3>
        {["All", "9", "8", "7"].map((rating) => (
          <p
            key={rating}
            onClick={() => { setSelectedRating(rating); setSidebarOpen(false); }}
            className={`cursor-pointer mb-1.5 text-sm ${selectedRating === rating ? "text-brand font-medium" : "text-fg-soft hover:text-white"}`}
          >
            {rating === "All" ? "All" : `${rating}+`}
          </p>
        ))}
      </div>

      <button
        onClick={() => { clearFilters(); setSidebarOpen(false); }}
        className="mt-2 w-full bg-brand hover:bg-brand-hover py-2 rounded-md text-sm font-medium transition cursor-pointer"
      >
        Clear Filters
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HERO SECTION */}
      <div
        className="relative h-64 sm:h-80 md:h-96 bg-cover bg-center flex items-center justify-center bg-surface"
        style={{ backgroundImage: heroBg ? `url(${heroBg})` : "none" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight">
            Explore Anime
          </h1>
          <p className="text-fg-soft text-sm sm:text-base md:text-lg max-w-xl mx-auto">
            Dive into the world of anime. From action-packed series to emotional masterpieces.
          </p>
        </div>
      </div>

      {/* MOBILE FILTER BUTTON */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Show filters"
          className="bg-brand hover:bg-brand-hover w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-surface h-full overflow-y-auto p-5 z-10 scrollbar-hide">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Filters</h2>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close filters" className="text-fg-muted hover:text-fg cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <FilterContent />
          </div>
        </div>
      )}

      {/* Initial full-page skeleton */}
      {initialLoading ? (
        <PageSkeleton />
      ) : (
        <div className={`${containerClasses} flex gap-8 py-8`}>

          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:block w-56 self-start rounded-2xl bg-surface ring-1 ring-line p-5 sticky top-24 shrink-0 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-hide">
            <h2 className="text-base font-semibold mb-5">Filters</h2>
            <FilterContent />
          </div>

          {/* ANIME GRID */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-fg-soft">
              Anime
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-2 sm:gap-3">
              {anime.map((item, index) => {
                if (anime.length === index + 1) {
                  return (
                    <div ref={lastAnimeRef} key={item.id}>
                      <MovieCard movie={item} variant="grid" index={index % 20} />
                    </div>
                  );
                }
                return (
                  <div key={item.id}>
                    <MovieCard movie={item} variant="grid" index={index % 20} />
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll skeleton */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-2 sm:gap-3 mt-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <MovieCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BACK TO TOP */}
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 bg-brand hover:bg-brand-hover w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 z-40"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}