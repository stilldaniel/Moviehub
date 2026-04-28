import type { Metadata } from "next";
import MovieDetailsClient from "./MovieDetailsClient";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const baseImageUrl = "https://image.tmdb.org/t/p/w1280";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`,
      { cache: "no-store" }
    );
    const movie = await res.json();

    if (!movie || movie.success === false) {
      return { title: "Movie Not Found" };
    }

    const title = movie.title || "Movie";
    const description =
      movie.overview
        ? movie.overview.slice(0, 160)
        : `Watch ${title} on MovieApp.`;
    const image = movie.backdrop_path
      ? `${baseImageUrl}${movie.backdrop_path}`
      : undefined;
    const year = movie.release_date?.slice(0, 4);
    const rating = movie.vote_average?.toFixed(1);

    return {
      title: `${title}${year ? ` (${year})` : ""}`,
      description,
      openGraph: {
        title: `${title}${year ? ` (${year})` : ""} | MovieApp`,
        description,
        type: "video.movie",
        images: image ? [{ url: image, width: 1280, height: 720, alt: title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title}${year ? ` (${year})` : ""} | MovieApp`,
        description,
        images: image ? [image] : [],
      },
      other: rating ? { "movie:rating": rating } : {},
    };
  } catch {
    return { title: "Movie | MovieApp" };
  }
}

export default async function MovieDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=videos`,
    { cache: "no-store" }
  );

  const movie = await res.json();

  if (!movie || movie.success === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Failed to load movie page
      </div>
    );
  }

  return <MovieDetailsClient movie={movie} />;
}