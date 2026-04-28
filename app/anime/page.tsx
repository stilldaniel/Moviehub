"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, SlidersHorizontal, X } from "lucide-react";
import MovieCard from "@/components/MovieCard";

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
      <div className="aspect-2/3 bg-gray-800 rounded-xl" />
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex gap-0 py-8">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-52 bg-[#141414] p-5 shrink-0 border-r border-gray-800">
        <div className="h-5 w-24 bg-gray-700 rounded animate-pulse mb-6" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="mb-6">
            <div className="h-3 w-16 bg-gray-700 rounded animate-pulse mb-3" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-3 w-20 bg-gray-800 rounded animate-pulse mb-2" />
            ))}
          </div>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8">
        <div className="h-6 w-32 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
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
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const debouncedYear = useDebounce(selectedYear, 400);
  const debouncedRating = useDebounce(selectedRating, 400);
  const debouncedType = useDebounce(selectedType, 400);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  useEffect(() => {
    const fetchHero = async () => {
      const res = await fetch(`https://api.themoviedb.org/3/tv/52698?api_key=${API_KEY}`);
      const data = await res.json();
      if (data.backdrop_path) {
        setHeroBg(`https://image.tmdb.org/t/p/original${data.backdrop_path}`);
      }
    };
    fetchHero();
  }, []);

  useEffect(() => {
    const fetchAnime = async () => {
      if (page === 1) setInitialLoading(true);
      else setLoading(true);

      const mediaType = selectedType === "TV" ? "tv" : "movie";
      let url = `https://api.themoviedb.org/3/discover/${mediaType}?api_key=${API_KEY}&with_genres=16&with_keywords=210024&sort_by=popularity.desc&page=${page}`;

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
        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Type</h3>
        {["All", "Movie", "TV"].map((type) => (
          <p
            key={type}
            onClick={() => { setSelectedType(type); setSidebarOpen(false); }}
            className={`cursor-pointer mb-1.5 text-sm ${selectedType === type ? "text-red-500 font-medium" : "text-gray-300 hover:text-white"}`}
          >
            {type === "All" ? "All" : type === "Movie" ? "Anime Movies" : "Anime Series"}
          </p>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Year</h3>
        {["All", "2024", "2023", "2022", "2021", "2020"].map((year) => (
          <p
            key={year}
            onClick={() => { setSelectedYear(year); setSidebarOpen(false); }}
            className={`cursor-pointer mb-1.5 text-sm ${selectedYear === year ? "text-red-500 font-medium" : "text-gray-300 hover:text-white"}`}
          >
            {year}
          </p>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-3">Rating</h3>
        {["All", "9", "8", "7"].map((rating) => (
          <p
            key={rating}
            onClick={() => { setSelectedRating(rating); setSidebarOpen(false); }}
            className={`cursor-pointer mb-1.5 text-sm ${selectedRating === rating ? "text-red-500 font-medium" : "text-gray-300 hover:text-white"}`}
          >
            {rating === "All" ? "All" : `${rating}+`}
          </p>
        ))}
      </div>

      <button
        onClick={() => { clearFilters(); setSidebarOpen(false); }}
        className="mt-2 w-full bg-red-600 hover:bg-red-700 py-2 rounded-md text-sm font-medium transition cursor-pointer"
      >
        Clear Filters
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HERO SECTION */}
      <div
        className="relative h-64 sm:h-80 md:h-96 bg-cover bg-center flex items-center justify-center bg-gray-900"
        style={{ backgroundImage: heroBg ? `url(${heroBg})` : "none" }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-black" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight">
            Explore Anime
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto">
            Dive into the world of anime. From action-packed series to emotional masterpieces.
          </p>
        </div>
      </div>

      {/* MOBILE FILTER BUTTON */}
      <div className="lg:hidden fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setSidebarOpen(true)}
          className="bg-red-600 hover:bg-red-700 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 bg-[#141414] h-full overflow-y-auto p-5 z-10 scrollbar-hide">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Filters</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
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
        <div className="flex gap-0 py-8">

          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:block w-52 bg-[#141414] p-5 sticky top-24 shrink-0 border-r border-gray-800 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-hide">
            <h2 className="text-base font-semibold mb-5">Filters</h2>
            <FilterContent />
          </div>

          {/* ANIME GRID */}
          <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-200">
              Anime
              <span className="text-gray-500 font-normal text-base ml-2">({anime.length})</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {anime.map((item, index) => {
                if (anime.length === index + 1) {
                  return (
                    <div ref={lastAnimeRef} key={item.id} className="w-full [&>a]:w-full! [&>a>img]:h-auto! [&>a>img]:aspect-2/3!">
                      <MovieCard movie={item} />
                    </div>
                  );
                }
                return (
                  <div key={item.id} className="w-full [&>a]:w-full! [&>a>img]:h-auto! [&>a>img]:aspect-2/3!">
                    <MovieCard movie={item} />
                  </div>
                );
              })}
            </div>

            {/* Infinite scroll skeleton */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 mt-3">
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
          className="fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 z-40"
        >
          <ChevronUp size={20} />
        </button>
      )}
    </div>
  );
}