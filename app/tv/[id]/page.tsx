import type { Metadata } from "next";
import TVDetailsClient from "./TVDetailsClient";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const baseImageUrl = "https://image.tmdb.org/t/p/w1280";

// Extracts the numeric TMDB ID from a slug like "1396-breaking-bad" → "1396"
// Also handles plain numeric IDs like "1396" for backwards compatibility
function extractId(slug: string): string {
  return slug.split("-")[0];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const id = extractId(slug);

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`,
      { cache: "no-store" }
    );
    const show = await res.json();

    if (!show || show.success === false) {
      return { title: "Show Not Found" };
    }

    const title = show.name || "TV Show";
    const description = show.overview
      ? show.overview.slice(0, 160)
      : `Watch ${title} on MovieApp.`;
    const image = show.backdrop_path
      ? `${baseImageUrl}${show.backdrop_path}`
      : undefined;
    const year = show.first_air_date?.slice(0, 4);
    const rating = show.vote_average?.toFixed(1);
    const seasons = show.number_of_seasons;

    return {
      title: `${title}${year ? ` (${year})` : ""}`,
      description,
      openGraph: {
        title: `${title}${year ? ` (${year})` : ""} | MovieApp`,
        description,
        type: "video.tv_show",
        images: image ? [{ url: image, width: 1280, height: 720, alt: title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title}${year ? ` (${year})` : ""} | MovieApp`,
        description,
        images: image ? [image] : [],
      },
      other: {
        ...(rating ? { "tv:rating": rating } : {}),
        ...(seasons ? { "tv:seasons": String(seasons) } : {}),
      },
    };
  } catch {
    return { title: "TV Show | MovieApp" };
  }
}

export default async function TVDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const id = extractId(slug);

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&append_to_response=videos`,
    { cache: "no-store" }
  );

  const show = await res.json();

  if (!show || show.success === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Failed to load TV show page
      </div>
    );
  }

  return <TVDetailsClient show={show} />;
}