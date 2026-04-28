"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

function RowSkeleton() {
  return (
    <div className="space-y-2">
      {/* Title skeleton */}
      <div className="h-6 w-40 bg-gray-800 rounded-md animate-pulse" />
      {/* Cards skeleton */}
      <div className="flex gap-4 overflow-hidden pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-40 md:w-48 rounded-xl bg-gray-800 animate-pulse"
            style={{ height: 240 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Row({
  title,
  fetchUrl,
  mediaType,
}: {
  title: string;
  fetchUrl: string;
  mediaType?: "movie" | "tv";
}) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        const res = await fetch(fetchUrl);
        const data = await res.json();

        if (data?.results) {
          const results = data.results.map((item: any) => ({
            ...item,
            media_type: item.media_type || mediaType || "movie",
          }));
          setMovies(results);
        }
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [fetchUrl, mediaType]);

  if (loading) return <RowSkeleton />;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto overflow-y-hidden scroll-smooth scrollbar-hide pb-2">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}