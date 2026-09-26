"use client";

import { useEffect, useState } from "react";
import MovieCard from "./MovieCard";
import { supabase, getSafeSession } from "@/lib/supabase";
const BASE_URL = "/api/tmdb";
const STORAGE_KEY = "moviehub_search_history";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type MediaItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path?: string;
  popularity?: number;
  vote_average?: number;
  genre_ids?: number[];
  release_date?: string;
};

type SeedItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  genre_ids?: number[];
  // weight: how strongly this seed should influence recommendations
  weight: number;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function loadSearchHistory(): SeedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = JSON.parse(raw || "[]") as Array<{
      id: number;
      media_type: "movie" | "tv";
      title: string;
    }>;
    // Most recent search = highest weight, declining by position
    return items.map((item, i) => ({ ...item, weight: 1 / (i + 1) }));
  } catch {
    return [];
  }
}

function dedupeMedia<T extends { id: number; media_type: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.media_type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Score each candidate based on how many of the user's preferred genres it matches
// and how much weight each matching seed carries
function scoreCandidate(
  candidate: MediaItem,
  genreWeights: Map<number, number>
): number {
  if (!candidate.genre_ids?.length) return 0;
  return candidate.genre_ids.reduce((sum, gid) => sum + (genreWeights.get(gid) || 0), 0);
}

// ─────────────────────────────────────────────
// Fetch helpers
// ─────────────────────────────────────────────
async function fetchDetails(id: number, mediaType: "movie" | "tv"): Promise<number[]> {
  try {
    const res = await fetch(`${BASE_URL}/${mediaType}/${id}`);
    const data = await res.json();
    return (data.genres || []).map((g: { id: number }) => g.id);
  } catch {
    return [];
  }
}

async function fetchRecommendations(seed: SeedItem): Promise<MediaItem[]> {
  try {
    const endpoint = seed.media_type === "movie" ? "movie" : "tv";
    const res = await fetch(
      `${BASE_URL}/${endpoint}/${seed.id}/recommendations?page=1`
    );
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: r.id,
      media_type: seed.media_type,
      title: seed.media_type === "movie" ? r.title : r.name,
      poster_path: r.poster_path,
      popularity: r.popularity,
      vote_average: r.vote_average,
      genre_ids: r.genre_ids,
      release_date: seed.media_type === "movie" ? r.release_date : r.first_air_date,
    }));
  } catch {
    return [];
  }
}

async function fetchSimilar(seed: SeedItem): Promise<MediaItem[]> {
  try {
    const endpoint = seed.media_type === "movie" ? "movie" : "tv";
    const res = await fetch(
      `${BASE_URL}/${endpoint}/${seed.id}/similar?page=1`
    );
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      id: r.id,
      media_type: seed.media_type,
      title: seed.media_type === "movie" ? r.title : r.name,
      poster_path: r.poster_path,
      popularity: r.popularity,
      vote_average: r.vote_average,
      genre_ids: r.genre_ids,
      release_date: seed.media_type === "movie" ? r.release_date : r.first_air_date,
    }));
  } catch {
    return [];
  }
}

async function fetchByGenre(
  genreId: number,
  mediaType: "movie" | "tv"
): Promise<MediaItem[]> {
  try {
    const endpoint = mediaType === "movie" ? "movie" : "tv";
    const res = await fetch(
      `${BASE_URL}/discover/${endpoint}?with_genres=${genreId}&sort_by=popularity.desc&page=1`
    );
    const data = await res.json();
    return (data.results || []).slice(0, 10).map((r: any) => ({
      id: r.id,
      media_type: mediaType,
      title: mediaType === "movie" ? r.title : r.name,
      poster_path: r.poster_path,
      popularity: r.popularity,
      vote_average: r.vote_average,
      genre_ids: r.genre_ids,
      release_date: mediaType === "movie" ? r.release_date : r.first_air_date,
    }));
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export default function ForYouFeed() {
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  // null = still checking, false = no data, true = has data
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // ── 1. Collect seeds from all three sources ──────────────────
        const localHistory = loadSearchHistory();

        let dbFavorites: SeedItem[] = [];
        let dbHistory: SeedItem[] = [];

        const { data: { session } } = await getSafeSession(supabase.auth);

        if (session?.user) {
          const [favRes, histRes] = await Promise.all([
            supabase
              .from("favorites")
              .select("media_id, media_type, title")
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: false })
              .limit(5),
            supabase
              .from("watch_history")
              .select("media_id, media_type, title")
              .eq("user_id", session.user.id)
              .order("watched_at", { ascending: false })
              .limit(5),
          ]);

          // Favorites get highest weight (user explicitly saved these)
          dbFavorites = (favRes.data || []).map((item: any, i: number) => ({
            id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            weight: 1.5 / (i + 1),
          }));

          // Watch history gets medium weight
          dbHistory = (histRes.data || []).map((item: any, i: number) => ({
            id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            weight: 1.0 / (i + 1),
          }));
        }

        // Merge all seeds, dedupe, cap at 6
        const allSeeds = dedupeMedia([
          ...dbFavorites,
          ...dbHistory,
          ...localHistory,
        ]).slice(0, 6) as SeedItem[];

        // ── 2. If no seeds at all, hide the section ──────────────────
        if (allSeeds.length === 0) {
          setHasData(false);
          setLoading(false);
          return;
        }

        setHasData(true);

        // ── 3. Enrich seeds with genre data ──────────────────────────
        const enriched = await Promise.all(
          allSeeds.map(async (seed) => {
            if (seed.genre_ids?.length) return seed;
            const genre_ids = await fetchDetails(seed.id, seed.media_type);
            return { ...seed, genre_ids };
          })
        );

        // ── 4. Build genre weight map ─────────────────────────────────
        // Each genre accumulates weight from every seed that contains it
        const genreWeights = new Map<number, number>();
        for (const seed of enriched) {
          for (const gid of seed.genre_ids || []) {
            genreWeights.set(gid, (genreWeights.get(gid) || 0) + seed.weight);
          }
        }

        // ── 5. Fetch candidates from multiple signals ─────────────────
        const [recGroups, simGroups, genreGroups] = await Promise.all([
          // Direct TMDB recommendations for top 3 seeds
          Promise.all(enriched.slice(0, 3).map(fetchRecommendations)),
          // Similar titles for top 3 seeds
          Promise.all(enriched.slice(0, 3).map(fetchSimilar)),
          // Top 2 genres → genre-based discovery
          Promise.all(
            [...genreWeights.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 2)
              .flatMap(([gid]) => {
                // Fetch for the dominant media type among seeds
                const movieSeeds = enriched.filter((s) => s.media_type === "movie").length;
                const tvSeeds = enriched.filter((s) => s.media_type === "tv").length;
                const mediaType: "movie" | "tv" = movieSeeds >= tvSeeds ? "movie" : "tv";
                return [fetchByGenre(gid, mediaType)];
              })
          ),
        ]);

        // ── 6. Merge all candidates ───────────────────────────────────
        const allCandidates = dedupeMedia(
          [...recGroups.flat(), ...simGroups.flat(), ...genreGroups.flat()]
        ).filter(
          // Remove items the user already has in their seeds
          (c) => !allSeeds.some((s) => s.id === c.id && s.media_type === c.media_type)
        );

        // ── 7. Score + rank ───────────────────────────────────────────
        // Final score = genre relevance score + popularity bonus + rating bonus
        const scored = allCandidates.map((item) => ({
          item,
          score:
            scoreCandidate(item, genreWeights) * 10 +
            (item.vote_average || 0) * 0.5 +
            Math.log((item.popularity || 1) + 1) * 0.2,
        }));

        scored.sort((a, b) => b.score - a.score);

        // ── 8. Light diversity shuffle ────────────────────────────────
        // Avoid showing 20 items all from the same genre.
        // Take top 30 scored, then interleave by media_type for variety.
        const top = scored.slice(0, 30).map((s) => s.item);
        const movies = top.filter((i) => i.media_type === "movie");
        const tvShows = top.filter((i) => i.media_type === "tv");
        const interleaved: MediaItem[] = [];
        const maxLen = Math.max(movies.length, tvShows.length);
        for (let i = 0; i < maxLen; i++) {
          if (movies[i]) interleaved.push(movies[i]);
          if (tvShows[i]) interleaved.push(tvShows[i]);
        }

        setRecommendations(dedupeMedia(interleaved).slice(0, 20));
      } catch (err) {
        console.error("ForYou feed error:", err);
        setHasData(false);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  // ── Don't render anything until we know if the user has data ──────
  if (loading) {
    // Show skeleton only if we might have data (null = still checking)
    if (hasData === false) return null;
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">For You</h2>
          <p className="text-sm text-gray-400">Building your personal feed…</p>
        </div>
        <div className="flex gap-4 overflow-hidden pt-3 pb-6 -mt-3 -mb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-40 sm:w-48 md:w-56 aspect-2/3 animate-pulse rounded-xl bg-[#161616]"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── No seeds → hide completely ────────────────────────────────────
  if (hasData === false || recommendations.length === 0) return null;

  

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">For You</h2>
        </div>
        
      </div>

      <div className="poster-row">
        {recommendations.map((item, i) => (
          <MovieCard key={`${item.media_type}-${item.id}`} movie={item} index={i} />
        ))}
      </div>
    </div>
  );
}