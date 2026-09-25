"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

function RowSkeleton() {
  return (
    <div className="space-y-2">
      {/* Title skeleton */}
      <div className="h-6 w-40 bg-gray-800 rounded-md animate-pulse" />
      {/* Cards skeleton */}
      <div className="flex gap-4 overflow-hidden pt-3 pb-6 -mt-3 -mb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-40 sm:w-48 md:w-56 aspect-2/3 rounded-xl bg-[#161616] animate-pulse"
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
      <div className="poster-row">
        {movies.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </div>
  );
}