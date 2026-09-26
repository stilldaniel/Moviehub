const TMDB_BASE = "https://api.themoviedb.org/3";

// Thrown for non-2xx TMDB responses so callers can tell "not found" apart from other failures
export class TMDBError extends Error {
  constructor(public status: number) {
    super(`TMDB request failed with status ${status}`);
  }
}

// On the server this calls TMDB directly with the server-only TMDB_API_KEY.
// In the browser it goes through /api/tmdb, so the key never reaches the client.
export async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  let url: string;
  if (typeof window === "undefined") {
    query.set("api_key", process.env.TMDB_API_KEY ?? "");
    url = `${TMDB_BASE}${endpoint}?${query}`;
  } else {
    url = `/api/tmdb${endpoint}?${query}`;
  }

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new TMDBError(res.status);
  return res.json();
}

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
