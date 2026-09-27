"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import { SectionHeader } from "./ui/Headings";
import { PosterRowSkeleton, SkeletonBlock } from "./ui/Skeleton";
import ScrollRow from "@/components/ui/ScrollRow";

function RowSkeleton() {
  return (
    <div>
      <SkeletonBlock className="h-6 w-40 mb-3" />
      <PosterRowSkeleton />
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
    <section>
      <SectionHeader title={title} className="mb-0" />
      <ScrollRow label={title}>
        {movies.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} index={i} />
        ))}
      </ScrollRow>
    </section>
  );
}