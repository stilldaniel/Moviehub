"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { FaPlay } from "react-icons/fa";
import { archivePosterUrl, type FreeFilm } from "@/lib/freeFilms";

function FreeFilmCard({ film, index }: { film: FreeFilm; index: number }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Link href={`/free/${encodeURIComponent(film.id)}`} className="poster-card poster-card--captioned w-full" style={{ "--i": index } as React.CSSProperties}>
      <div className="poster-frame">
        <img
          src={film.posterPath ? `https://image.tmdb.org/t/p/w500${film.posterPath}` : archivePosterUrl(film.id)}
          alt={film.title}
          loading="lazy"
          decoding="async"
          data-loaded={loaded}
          onLoad={() => setLoaded(true)}
          ref={(img) => { if (img?.complete && img.naturalWidth > 0 && !loaded) setLoaded(true); }}
          className="poster-img"
        />
        <div className="poster-badge left-2 text-emerald-300">Free</div>
        <div className="poster-shade" />
        <div className="poster-info">
          <h3 className="poster-title">{film.title}</h3>
          <p className="poster-meta">{film.year ?? "Public domain"}</p>
          <div className="poster-actions">
            <div className="poster-play">
              <FaPlay size={10} />
              Watch free
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// "Free to Watch" tab on the Movies page: public-domain films from the Internet Archive
export default function FreeFilmsBrowser() {
  const [films, setFilms] = useState<FreeFilm[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const observer = useRef<IntersectionObserver | null>(null);

  // Wait until typing pauses before searching; only restart when the search text actually changes
  useEffect(() => {
    const next = input.trim();
    if (next === search) return;
    const t = setTimeout(() => {
      setSearch(next);
      setFilms([]);
      setPage(1);
      setHasMore(true);
      setLoading(true);
      setError("");
    }, 400);
    return () => clearTimeout(t);
  }, [input, search]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/free-films?page=${page}${search ? `&q=${encodeURIComponent(search)}` : ""}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        return data as { films: FreeFilm[]; hasMore: boolean };
      })
      .then((data) => {
        if (cancelled) return;
        setFilms((prev) => {
          const combined = page === 1 ? data.films : [...prev, ...data.films];
          return Array.from(new Map(combined.map((f) => [f.id, f])).values());
        });
        setHasMore(data.hasMore);
      })
      .catch((err: Error) => { if (!cancelled) setError(err.message || "Couldn't load free films."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search]);

  const lastFilmRef = useCallback(
    (node: HTMLDivElement | null) => {
      observer.current?.disconnect();
      if (!node || loading || !hasMore) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setLoading(true);
          setPage((p) => p + 1);
        }
      }, { rootMargin: "400px" });
      observer.current.observe(node);
    },
    [loading, hasMore]
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Free to Watch</h2>
          <p className="text-sm text-gray-500">Public-domain films from the Internet Archive, free to watch in full</p>
        </div>
        <label className="flex items-center gap-2 bg-[#141414] border border-gray-800 rounded-lg px-3 focus-within:border-gray-600 transition sm:w-72">
          <Search size={15} className="text-gray-500 shrink-0" />
          <span className="sr-only">Search free films</span>
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search free films…"
            className="w-full bg-transparent py-2 text-sm text-white placeholder-gray-500 outline-none"
          />
        </label>
      </div>

      {error && films.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">{error}</p>
      ) : !loading && films.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">
          No free films match &ldquo;{search}&rdquo;. Try a different title.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
          {films.map((film, i) => (
            <div key={film.id} ref={i === films.length - 1 ? lastFilmRef : undefined}>
              <FreeFilmCard film={film} index={i % 30} />
            </div>
          ))}
          {loading &&
            Array.from({ length: 12 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="aspect-2/3 rounded-xl bg-[#161616] animate-pulse" />
            ))}
        </div>
      )}
    </div>
  );
}
