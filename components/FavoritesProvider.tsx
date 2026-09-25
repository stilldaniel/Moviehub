"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, getSafeSession } from "@/lib/supabase";

type MediaType = "movie" | "tv";

export type FavoriteInput = {
  media_id: number;
  media_type: MediaType;
  title: string;
  poster_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
};

type FavoritesContextValue = {
  user: User | null;
  isFavorite: (mediaId: number, mediaType: MediaType) => boolean;
  // Returns the new favorite state, or null if the user was sent to login / the write failed
  toggleFavorite: (item: FavoriteInput) => Promise<boolean | null>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const keyOf = (mediaId: number, mediaType: string) => `${mediaType}-${mediaId}`;

// Loads the signed-in user's favorite IDs once and shares them with every card,
// instead of each card querying Supabase on its own.
export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  // Supabase also fires SIGNED_IN when it restores a saved session, so skip reloading for the same user
  const loadedUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;

    const load = async (sessionUser: User | null) => {
      setUser(sessionUser);
      const userId = sessionUser?.id ?? null;
      if (loadedUserId.current === userId) return;
      loadedUserId.current = userId;
      if (!sessionUser) {
        setFavoriteKeys(new Set());
        return;
      }
      const { data, error } = await supabase
        .from("favorites")
        .select("media_id, media_type")
        .eq("user_id", sessionUser.id);
      if (error) {
        console.error("Failed to load favorites:", error.message);
        return;
      }
      setFavoriteKeys(
        new Set((data || []).map((f: { media_id: number; media_type: string }) => keyOf(f.media_id, f.media_type)))
      );
    };

    getSafeSession(supabase.auth).then(({ data: { session } }) => load(session?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event: string, session: Session | null) => {
        // Token refreshes fire often and don't change who is signed in
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          load(session?.user ?? null);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const isFavorite = useCallback(
    (mediaId: number, mediaType: MediaType) => favoriteKeys.has(keyOf(mediaId, mediaType)),
    [favoriteKeys]
  );

  const toggleFavorite = useCallback(
    async (item: FavoriteInput) => {
      if (!user) {
        window.location.href = "/auth/login";
        return null;
      }

      const key = keyOf(item.media_id, item.media_type);
      const wasFavorite = favoriteKeys.has(key);

      const setKey = (present: boolean) =>
        setFavoriteKeys((prev) => {
          const next = new Set(prev);
          if (present) next.add(key);
          else next.delete(key);
          return next;
        });

      // Optimistic update, rolled back if the write fails
      setKey(!wasFavorite);

      const { error } = wasFavorite
        ? await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("media_id", item.media_id)
            .eq("media_type", item.media_type)
        : await supabase.from("favorites").insert({
            user_id: user.id,
            media_id: item.media_id,
            media_type: item.media_type,
            title: item.title,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            genre_ids: item.genre_ids || [],
          });

      if (error) {
        console.error("Failed to update favorite:", error.message);
        setKey(wasFavorite);
        return null;
      }
      return !wasFavorite;
    },
    [user, favoriteKeys]
  );

  return (
    <FavoritesContext.Provider value={{ user, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
