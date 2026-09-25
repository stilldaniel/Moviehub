"use client";

import { useEffect, useState } from "react";
import { supabase, getSafeSession } from "@/lib/supabase";
import Link from "next/link";
import MovieCard from "@/components/MovieCard";

interface FavoriteItem {
  id: string;
  user_id: string;
  media_id: number;
  media_type: string;
  title: string;
  poster_path: string;
  vote_average: number;
  created_at: string;
  genre_ids?: number[];
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await getSafeSession(supabase.auth);
      if (!session?.user) {
        window.location.href = "/auth/login";
        return;
      }
      fetchFavorites(session.user.id);
    };
    init();
  }, []);

  const fetchFavorites = async (userId: string) => {
    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setFavorites((data as FavoriteItem[]) || []);
    setLoading(false);
  };

  const removeFromList = (item: FavoriteItem) =>
    setFavorites((prev) =>
      prev.filter((f) => !(f.media_id === item.media_id && f.media_type === item.media_type))
    );

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 px-4 sm:px-6 lg:px-10">

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">My Favorites</h1>
        <p className="text-gray-400 text-sm mt-1">{favorites.length} saved {favorites.length === 1 ? "title" : "titles"}</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <p className="text-5xl mb-4">❤️</p>
          <p className="text-lg font-medium">No favorites yet</p>
          <p className="text-sm mt-1">Start adding movies and shows you love</p>
          <Link
            href="/"
            className="mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
          >
            Browse Movies
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {favorites.map((item, i) => (
            <MovieCard
              key={item.id}
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
              onFavoriteChange={(isFavorite) => { if (!isFavorite) removeFromList(item); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}