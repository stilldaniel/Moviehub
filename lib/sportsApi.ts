// Server-only: requests to API-Sports with caching. Kept apart from lib/sports.ts, which the browser also loads.
import { unstable_cache } from "next/cache";
import { SportsApiError, type SportConfig } from "./sports";

const UNAVAILABLE = "Scores are temporarily unavailable. Please check back later.";

async function fetchFromApiSports(url: string, key: string) {
  const res = await fetch(url, { headers: { "x-apisports-key": key }, cache: "no-store" });
  if (!res.ok) {
    console.error(`API-Sports ${res.status} for ${url}`);
    throw new SportsApiError(UNAVAILABLE);
  }
  const data = await res.json();
  // Errors (daily limit, suspended account, bad key…) come back with status 200 and a non-empty "errors" field
  const errors = data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length);
  if (errors) {
    const detail = JSON.stringify(data.errors);
    // Full detail goes to the server logs (Vercel → Logs); visitors get a plain message
    console.error(`API-Sports error for ${url}: ${detail}`);
    throw new SportsApiError(
      /limit|requests/i.test(detail) && !/suspend/i.test(detail)
        ? "Today's free data limit for this sport has been reached. Scores will be back tomorrow."
        : UNAVAILABLE
    );
  }
  return data.response ?? [];
}

// Sends one request to API-Sports. Successful responses are cached for `revalidate` seconds so the
// 100-requests-per-day free limit per sport isn't exceeded. Failures throw, and a thrown result is
// never cached, so the app recovers as soon as the API does instead of serving a cached error.
export async function sportsRequest(sport: SportConfig, path: string, params: Record<string, string>, revalidate: number) {
  const key = process.env.SPORTS_API_KEY;
  if (!key) throw new SportsApiError(UNAVAILABLE);
  const url = `https://${sport.host}/${path}?${new URLSearchParams(params)}`;
  return unstable_cache(() => fetchFromApiSports(url, key), ["api-sports", url], { revalidate })();
}
