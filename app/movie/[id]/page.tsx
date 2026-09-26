import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchFromTMDB, TMDBError } from "@/lib/tmdb";
import MovieDetailsClient from "./MovieDetailsClient";

const baseImageUrl = "https://image.tmdb.org/t/p/w1280";

// Extracts the numeric TMDB ID from a slug like "155-the-dark-knight" → "155"
// Also handles plain numeric IDs like "155" for backwards compatibility
function extractId(slug: string): string {
  return slug.split("-")[0];
}

// One cached request serves both generateMetadata and the page.
// Returns null when TMDB has no such title, so the page can show a 404.
const getMovie = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) return null;
  try {
    return await fetchFromTMDB(`/movie/${id}`, { append_to_response: "videos" });
  } catch (error) {
    if (error instanceof TMDBError && error.status === 404) return null;
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const id = extractId(slug);

  try {
    const movie = await getMovie(id);

    if (!movie) {
      return { title: "Movie Not Found" };
    }

    const title = movie.title || "Movie";
    const description = movie.overview
      ? movie.overview.slice(0, 160)
      : `Watch ${title} on Zora Stream.`;
    const image = movie.backdrop_path
      ? `${baseImageUrl}${movie.backdrop_path}`
      : undefined;
    const year = movie.release_date?.slice(0, 4);
    const rating = movie.vote_average?.toFixed(1);

    return {
      title: `${title}${year ? ` (${year})` : ""}`,
      description,
      openGraph: {
        title: `${title}${year ? ` (${year})` : ""} | Zora Stream`,
        description,
        type: "video.movie",
        images: image ? [{ url: image, width: 1280, height: 720, alt: title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title}${year ? ` (${year})` : ""} | Zora Stream`,
        description,
        images: image ? [image] : [],
      },
      other: rating ? { "movie:rating": rating } : {},
    };
  } catch {
    return { title: "Movie | Zora Stream" };
  }
}

export default async function MovieDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const id = extractId(slug);

  const movie = await getMovie(id);
  if (!movie) notFound();

  return <MovieDetailsClient movie={movie} />;
}