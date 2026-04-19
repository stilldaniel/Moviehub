"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { FaStar, FaPlay, FaPlus, FaCheck } from "react-icons/fa";

const baseImageUrl = "https://image.tmdb.org/t/p/w500";

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = "/auth/login";
        return;
      }
      setUser(session.user);
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

  const toggleFavorite = async (e: React.MouseEvent, item: FavoriteItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.href = "/auth/login"; return; }

    const isAlreadyFav = favorites.some(
      (f) => f.media_id === item.media_id && f.media_type === item.media_type
    );

    if (isAlreadyFav) {
      await supabase.from("favorites").delete()
        .eq("user_id", user.id)
        .eq("media_id", item.media_id)
        .eq("media_type", item.media_type);
      setFavorites((prev) =>
        prev.filter((f) => !(f.media_id === item.media_id && f.media_type === item.media_type))
      );
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        media_id: item.media_id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        genre_ids: item.genre_ids || [],
      });
      setFavorites((prev) => [...prev, { ...item, user_id: user.id }]);
    }
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

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">My Favorites</h1>
        <p className="text-gray-400 text-sm mt-1">{favorites.length} saved titles</p>
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
          {favorites.map((item) => {
            const isFav = favorites.some(
              (f) => f.media_id === item.media_id && f.media_type === item.media_type
            );
            return (
              <Link
                key={item.id}
                href={`/${item.media_type}/${item.media_id}`}
                className="relative group cursor-pointer block transform transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-105 hover:shadow-[0_10px_40px_rgba(239,68,68,0.35)]"
              >
                {/* Poster */}
                <img
                  src={`${baseImageUrl}${item.poster_path}`}
                  alt={item.title}
                  className="w-full object-cover rounded-xl"
                  style={{ aspectRatio: "2/3" }}
                />

                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-black/90 text-yellow-400 text-sm px-2.5 py-1 rounded-md font-semibold backdrop-blur-sm flex items-center gap-1">
                  <FaStar size={11} className="text-yellow-400" />
                  {item.vote_average?.toFixed(1)}
                </div>

                {/* TV badge */}
                {item.media_type === "tv" && (
                  <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
                    TV
                  </div>
                )}

                {/* Hover overlay — matches MovieCard exactly */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4"
                  style={{ background: "linear-gradient(to top, black, rgba(0,0,0,0.7), transparent)" }}
                >
                  <h3 className="text-white text-base md:text-lg font-semibold leading-tight truncate">
                    {item.title}
                  </h3>
                  <p className="text-gray-300 text-sm mt-1 mb-3">
                    {item.media_type === "tv" ? "TV Show" : "Movie"}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Play button */}
                    <div className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-md font-medium text-center transition flex items-center justify-center gap-2">
                      <FaPlay size={12} />
                      Play
                    </div>
                    {/* Favorite toggle */}
                    <button
                      onClick={(e) => toggleFavorite(e, item)}
                      className={`px-3 py-2 rounded-md font-semibold transition flex items-center justify-center cursor-pointer ${
                        isFav
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-700/90 hover:bg-gray-600 text-white"
                      }`}
                    >
                      {isFav ? <FaCheck size={14} /> : <FaPlus size={14} />}
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}