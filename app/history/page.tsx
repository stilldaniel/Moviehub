"use client";

import { useEffect, useState } from "react";
import { supabase, getSafeSession } from "@/lib/supabase";
import Link from "next/link";
import { FaStar, FaTrash } from "react-icons/fa";

const baseImageUrl = "https://image.tmdb.org/t/p/w500";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 sm:px-6 lg:px-10">

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Watch History</h1>
          <p className="text-gray-400 text-sm mt-1">{history.length} titles watched</p>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-red-400 hover:text-red-300 transition cursor-pointer border border-red-400/30 hover:border-red-300/50 px-4 py-2 rounded-lg"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <p className="text-5xl mb-4">🎬</p>
          <p className="text-lg font-medium">No watch history yet</p>
          <p className="text-sm mt-1">Movies and shows you watch will appear here</p>
          <Link
            href="/"
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {history.map((item) => (
            <div key={item.id} className="relative group">
              <Link href={`/${item.media_type}/${item.media_id}`}>
                <div className="relative">
                  <img
                    src={`${baseImageUrl}${item.poster_path}`}
                    alt={item.title}
                    className="w-full aspect-2/3 object-cover rounded-xl"
                  />
                  <div className="absolute top-2 right-2 bg-black/90 text-yellow-400 text-xs px-2 py-0.5 rounded-md font-semibold flex items-center gap-1">
                    <FaStar size={10} />
                    {item.vote_average?.toFixed(1)}
                  </div>
                  {item.media_type === "tv" && (
                    <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                      TV
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white text-sm font-medium text-center px-2">{item.title}</p>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-xs text-gray-300 bg-black/70 px-2 py-1 rounded-md">
                    {new Date(item.watched_at ?? item.created_at ?? Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </Link>

              <button
                onClick={() => removeHistory(item.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-600 hover:bg-red-700 rounded-full items-center justify-center text-white hidden group-hover:flex transition cursor-pointer z-10"
              >
                <FaTrash size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}