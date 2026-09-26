"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import { FREE_CLASSICS } from "@/lib/freeClassics";

// Home page row of public-domain films that play in full inside the app
export default function FreeClassicsRow() {
  const [movies, setMovies] = useState<any[] | null>(null);

  useEffect(() => {
    Promise.all(
      FREE_CLASSICS.map(({ tmdbId }) =>
        fetch(`/api/tmdb/movie/${tmdbId}`)
          .then((res) => (res.ok ? res.json() : null))
          .catch(() => null)
      )
    ).then((details) =>
      setMovies(
        details
          .filter(Boolean)
          .map((m) => ({ ...m, media_type: "movie", genre_ids: m.genres?.map((g: { id: number }) => g.id) }))
      )
    );
  }, []);

  if (movies !== null && movies.length === 0) return null;

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-xl font-semibold">Free to Watch</h2>
        <p className="text-sm text-gray-400">Public-domain classics you can watch in full, right here</p>
      </div>
      {movies === null ? (
        <div className="flex gap-4 overflow-hidden pt-3 pb-6 -mt-3 -mb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-40 sm:w-48 md:w-56 aspect-2/3 rounded-xl bg-[#161616] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="poster-row">
          {movies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
