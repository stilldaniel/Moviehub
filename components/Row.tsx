"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

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

  useEffect(() => {
    async function fetchMovies() {
      try {
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
      }
    }

    fetchMovies();
  }, [fetchUrl, mediaType]);

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