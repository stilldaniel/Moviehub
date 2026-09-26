"use client";

import { useEffect, useState } from "react";
import { supabase, getSafeSession } from "@/lib/supabase";
import { FaTrash } from "react-icons/fa";
import { History } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/Headings";
import Spinner from "@/components/ui/Spinner";

interface HistoryItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: string;
  title: string;
  poster_path: string;
  vote_average: number;
  watched_at: string;
  created_at?: string;
  progress?: number;
  runtime?: number;
  genre_ids?: number[];
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await getSafeSession(supabase.auth);
      if (!session?.user) {
        window.location.href = "/auth/login";
        return;
      }
      fetchHistory(session.user.id);
    };
    init();
  }, []);

  const fetchHistory = async (userId: string) => {
    const { data } = await supabase
      .from("watch_history")
      .select("*")
      .eq("user_id", userId)
      .order("watched_at", { ascending: false }); // ← fixed: was "created_at"
    setHistory((data as HistoryItem[]) || []);
    setLoading(false);
  };

  const removeHistory = async (id: string) => {
    await supabase.from("watch_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const clearAll = async () => {
    const { data: { session } } = await getSafeSession(supabase.auth);
    if (!session?.user) return;
    await supabase.from("watch_history").delete().eq("user_id", session.user.id);
    setHistory([]);
  };

  if (loading) return <Spinner />;

  return (
    <Container className="min-h-screen pt-28 pb-16">
      <PageHeader
        title="Watch History"
        description={`${history.length} ${history.length === 1 ? "title" : "titles"} watched`}
        actions={history.length > 0 && <Button variant="danger" size="sm" onClick={clearAll}>Clear all</Button>}
      />

      {history.length === 0 ? (
        <EmptyState
          icon={<History size={24} />}
          title="No watch history yet"
          description="Titles you watch trailers or free films for will show up here."
          action={<Button href="/">Browse movies</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {history.map((item, i) => (
            <div key={item.id}>
              <MovieCard
                variant="grid"
                index={i}
                movie={{
                  id: item.media_id,
                  media_type: item.media_type,
                  title: item.title,
                  poster_path: item.poster_path,
                  vote_average: item.vote_average,
                  genre_ids: item.genre_ids,
                }}
              />
              <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
                <span className="text-xs text-fg-subtle">
                  {new Date(item.watched_at ?? item.created_at ?? Date.now()).toLocaleDateString()}
                </span>
                <button
                  onClick={() => removeHistory(item.id)}
                  aria-label={`Remove ${item.title} from history`}
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-fg-subtle transition hover:text-danger cursor-pointer"
                >
                  <FaTrash size={10} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
