import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchFromTMDB, TMDBError } from "@/lib/tmdb";
import TVDetailsClient from "./TVDetailsClient";

const baseImageUrl = "https://image.tmdb.org/t/p/w1280";

// Extracts the numeric TMDB ID from a slug like "1396-breaking-bad" → "1396"
// Also handles plain numeric IDs like "1396" for backwards compatibility
function extractId(slug: string): string {
  return slug.split("-")[0];
}

// One cached request serves both generateMetadata and the page.
// Returns null when TMDB has no such title, so the page can show a 404.
const getShow = cache(async (id: string) => {
  if (!/^\d+$/.test(id)) return null;
  try {
    return await fetchFromTMDB(`/tv/${id}`, { append_to_response: "videos" });
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
    const show = await getShow(id);

    if (!show) {
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

  const show = await getShow(id);
  if (!show) notFound();

  return <TVDetailsClient show={show} />;
}