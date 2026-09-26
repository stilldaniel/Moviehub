"use client";

import Link from "next/link";
import { useState } from "react";
import { genreMap } from "@/lib/genres";
import { FaPlay, FaPlus, FaCheck, FaStar } from "react-icons/fa";
import { useFavorites } from "./FavoritesProvider";
import { mediaHref } from "@/lib/utils";

const baseImageUrl = "https://image.tmdb.org/t/p/w500";

export default function MovieCard({
  movie,
  variant = "row",
  index = 0,
  onFavoriteChange,
}: {
  movie: any;
  // "row" = fixed width for horizontal rows, "grid" = fills its grid cell
  variant?: "row" | "grid";
  // Position in the list, used to stagger the entrance animation
  index?: number;
  onFavoriteChange?: (isFavorite: boolean) => void;
}) {
  const { isFavorite: checkIsFavorite, toggleFavorite: toggle } = useFavorites();
  const [loaded, setLoaded] = useState(false);

  const mediaType = movie.media_type === "tv" ? "tv" : "movie";
  const isFavorite = checkIsFavorite(movie.id, mediaType);

  const genres = movie.genre_ids
    ?.slice(0, 2)
    .map((id: number) => genreMap[id])
    .filter(Boolean)
    .join(", ");
  const year = (movie.release_date || movie.first_air_date)?.slice(0, 4);
  const meta = [year, genres || (mediaType === "tv" ? "TV Show" : "Movie")].filter(Boolean).join(" · ");

  const title = movie.title || movie.name || "";
  const href = mediaHref(mediaType, movie.id, title);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggle({
      media_id: movie.id,
      media_type: mediaType,
      title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids,
    });
    if (result !== null) onFavoriteChange?.(result);
  };

  return (
    <Link
      href={href}
      className={`poster-card ${variant === "row" ? "w-40 sm:w-48 md:w-56" : "w-full"}`}
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="poster-frame">
        {movie.poster_path ? (
          <img
            src={`${baseImageUrl}${movie.poster_path}`}
            alt={title}
            loading="lazy"
            decoding="async"
            data-loaded={loaded}
            onLoad={() => setLoaded(true)}
            ref={(img) => {
              // Cached images can finish loading before React attaches onLoad
              if (img?.complete && img.naturalWidth > 0 && !loaded) setLoaded(true);
            }}
            className="poster-img"
          />
        ) : (
          <div className="poster-fallback">{title}</div>
        )}

        {movie.vote_average > 0 && (
          <div className="poster-badge right-2 text-yellow-400">
            <FaStar size={9} />
            {movie.vote_average.toFixed(1)}
          </div>
        )}
        {mediaType === "tv" && <div className="poster-badge left-2 text-white/90">TV</div>}

        <div className="poster-shade" />

        <div className="poster-info">
          <h3 className="poster-title">{title}</h3>
          <p className="poster-meta">{meta}</p>
          <div className="poster-actions">
            <div className="poster-play">
              <FaPlay size={10} />
              Play
            </div>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-pressed={isFavorite}
              aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
              className="poster-fav"
            >
              {isFavorite ? <FaCheck size={11} /> : <FaPlus size={11} />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
