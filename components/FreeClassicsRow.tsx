"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MovieCard from "./MovieCard";
import { SectionHeader } from "./ui/Headings";
import { PosterRowSkeleton } from "./ui/Skeleton";
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
    <section>
      <SectionHeader
        title="Free to Watch"
        description="Public-domain classics you can watch in full, right here"
        className="mb-0"
        action={<Link href="/movie?tab=free" className="text-fg-muted hover:text-fg transition">See all →</Link>}
      />
      {movies === null ? (
        <PosterRowSkeleton />
      ) : (
        <div className="poster-row">
          {movies.map((movie, i) => (
            <MovieCard key={movie.id} movie={movie} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
