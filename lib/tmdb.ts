const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export async function fetchFromTMDB(endpoint: string) {
  const res = await fetch(
    `${BASE_URL}${endpoint}?api_key=${API_KEY}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export const getTrending = () =>
  fetchFromTMDB("/trending/movie/week");

export const getTopRated = () =>
  fetchFromTMDB("/movie/top_rated");

export const getPopular = () =>
  fetchFromTMDB("/movie/popular");

// Runtime in minutes: the film's length, or one episode's length for a TV show.
// Returns null when TMDB has no runtime for the title.
export function runtimeFromDetails(details: any, mediaType: "movie" | "tv"): number | null {
  const minutes =
    mediaType === "movie"
      ? details?.runtime
      : details?.episode_run_time?.[0] ?? details?.last_episode_to_air?.runtime;
  return minutes > 0 ? minutes : null;
}

export async function fetchRuntime(id: number, mediaType: "movie" | "tv"): Promise<number | null> {
  try {
    return runtimeFromDetails(await fetchFromTMDB(`/${mediaType}/${id}`), mediaType);
  } catch {
    return null;
  }
}
