"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MovieCard from "@/components/MovieCard";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import { PageHeader, SectionHeader } from "@/components/ui/Headings";
import Spinner from "@/components/ui/Spinner";
import { SearchX } from "lucide-react";
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
    <Container className="min-h-screen pt-28 pb-16">
      <PageHeader title={<>Results for <span className="text-brand">&ldquo;{query}&rdquo;</span></>} className="mb-6" />

      <div role="tablist" aria-label="Filter results" className="flex flex-wrap gap-2 border-b border-line pb-4 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "movies", label: "Movies" },
          { key: "tv", label: "TV & Anime" },
        ].map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition cursor-pointer ${
              activeTab === tab.key
                ? "bg-brand text-white"
                : "bg-surface-raised text-fg-soft hover:bg-control"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="aspect-2/3 animate-pulse rounded-xl bg-surface-raised" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<SearchX size={24} />}
          title={`No results for “${query}”`}
          description="Check the spelling or try a shorter title."
        />
      )}

      {!loading && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3">
            {filtered.map((item, i) => (
              <MovieCard key={`${item.media_type}-${item.id}`} movie={item} variant="grid" index={i} />
            ))}
          </div>

          {recommendations.length > 0 && (
            <section className="mt-10">
              <SectionHeader
                title="Recommended for you"
                description={<>Based on &ldquo;{recommendationSource}&rdquo;</>}
                action={loadingRecommendations && <span className="text-fg-muted">Refreshing…</span>}
                className="mb-4"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3">
                {recommendations.map((item, i) => (
                  <MovieCard key={`rec-${item.media_type}-${item.id}`} movie={item} variant="grid" index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={<Spinner className="min-h-screen" />}
    >
      <SearchResults />
    </Suspense>
  );
}
