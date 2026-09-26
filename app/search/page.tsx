"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MovieCard from "@/components/MovieCard";
const BASE_URL = "/api/tmdb";
const SEARCH_HISTORY_KEY = "moviehub_search_history";

type MediaItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path?: string;
  popularity?: number;
  release_date?: string;
};

type SearchHistoryItem = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
};

function saveSearchHistory(item: SearchHistoryItem) {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const history: SearchHistoryItem[] = raw ? JSON.parse(raw) : [];
    const filtered = history.filter(
      (historyItem) => historyItem.id !== item.id || historyItem.media_type !== item.media_type
    );

    const nextHistory = [item, ...filtered].slice(0, 6);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
  } catch (error) {
    console.error("Failed to save search history:", error);
  }
}

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";

  const [results, setResults] = useState<MediaItem[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const [recommendationSource, setRecommendationSource] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!query) {
      setResults([]);
      setRecommendations([]);
      setRecommendationSource("");
      return;
    }

    const fetchRecommendations = async (item: MediaItem): Promise<MediaItem[]> => {
      const endpoint = item.media_type === "movie" ? "movie" : "tv";
      const response = await fetch(
        `${BASE_URL}/${endpoint}/${item.id}/recommendations?page=1`
      );
      const data = await response.json();

      return (data.results || []).map((rec: any) => ({
        ...rec,
        media_type: item.media_type,
        title: item.media_type === "movie" ? rec.title : rec.name,
        release_date: item.media_type === "movie" ? rec.release_date : rec.first_air_date,
      }));
    };

    const fetchResults = async () => {
      setLoading(true);
      setLoadingRecommendations(true);

      try {
        const [moviesRes, tvRes] = await Promise.all([
          fetch(
            `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=1`
          ),
          fetch(
            `${BASE_URL}/search/tv?query=${encodeURIComponent(query)}&page=1`
          ),
        ]);

        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();

        const movies: MediaItem[] = (moviesData.results || []).map((movie: any) => ({
          ...movie,
          media_type: "movie",
          title: movie.title,
          release_date: movie.release_date,
        }));

        const tv: MediaItem[] = (tvData.results || []).map((show: any) => ({
          ...show,
          media_type: "tv",
          title: show.name,
          release_date: show.first_air_date,
        }));

        const combined = [...movies, ...tv]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 50);

        setResults(combined);

        if (combined.length > 0) {
          const topItem = combined[0];
          setRecommendationSource(topItem.title || query);
          saveSearchHistory({
            id: topItem.id,
            media_type: topItem.media_type,
            title: topItem.title,
          });
          const recs = await fetchRecommendations(topItem);
          setRecommendations(recs.filter((rec) => rec.id !== topItem.id));
        } else {
          setRecommendations([]);
          setRecommendationSource("");
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setRecommendations([]);
        setRecommendationSource("");
      } finally {
        setLoading(false);
        setLoadingRecommendations(false);
      }
    };

    fetchResults();
  }, [query]);

  const filtered =
    activeTab === "all"
      ? results
      : activeTab === "movies"
      ? results.filter((item) => item.media_type === "movie")
      : results.filter((item) => item.media_type === "tv");

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 sm:px-6 lg:px-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Search results for <span className="text-red-500">"{query}"</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">{results.length} results found</p>
      </div>

      <div className="flex flex-wrap gap-3 border-b border-gray-800 pb-4 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "movies", label: "Movies" },
          { key: "tv", label: "TV & Anime" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "bg-red-500 text-black"
                : "bg-white/5 text-gray-300 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-2/3 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg font-medium">No results found for "{query}"</p>
          <p className="text-sm mt-1">Try a different search term or spelling.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((item, i) => (
              <MovieCard key={`${item.media_type}-${item.id}`} movie={item} variant="grid" index={i} />
            ))}
          </div>

          {recommendations.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Recommended for you</h2>
                  <p className="text-sm text-gray-400">Based on "{recommendationSource}"</p>
                </div>
                {loadingRecommendations && (
                  <span className="text-sm text-gray-400">Refreshing recommendations...</span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {recommendations.map((item, i) => (
                  <MovieCard key={`rec-${item.media_type}-${item.id}`} movie={item} variant="grid" index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-gray-400">Loading...</p>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
