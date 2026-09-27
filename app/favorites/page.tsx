"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase, getSafeSession } from "@/lib/supabase";
import MovieCard from "@/components/MovieCard";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/Headings";
import Spinner from "@/components/ui/Spinner";
import { Heart } from "lucide-react";

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
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await getSafeSession(supabase.auth);
      if (!session?.user) {
        router.replace("/auth/login");
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

  if (loading) return <Spinner />;

  return (
    <Container className="min-h-screen pt-28 pb-16">
      <PageHeader
        title="My Favorites"
        description={`${favorites.length} saved ${favorites.length === 1 ? "title" : "titles"}`}
      />

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart size={24} />}
          title="No favorites yet"
          description="Tap + on any movie or show to save it here."
          action={<Button href="/">Browse movies</Button>}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-8 gap-3 sm:gap-4">
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
    </Container>
  );
}
