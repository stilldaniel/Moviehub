"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";

export default function MovieRow({
  title,
  fetchUrl,
}: {
  title: string;
  fetchUrl: string;
}) {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);

        const res = await fetch(fetchUrl);

        if (!res.ok) {
          throw new Error("Failed to fetch movies");
        }

        const data = await res.json();

        setMovies(data.results || []);
      } catch (error) {
        console.error("MovieRow fetch error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [fetchUrl]);

  return (
    <section className="px-8 mt-16">

      <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
        {title}
      </h2>

      {/* Horizontal scroll only - prevents vertical scroll */}
      <div
        className="
          flex
          flex-row
          gap-6
          overflow-x-auto
          overflow-y-hidden
          scrollbar-hide
        "
      >

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : (
          movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))
        )}

      </div>

    </section>
  );
}