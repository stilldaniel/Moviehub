"use client";

import Link from "next/link";
import { genreMap } from "@/lib/genres";
import { FaPlay, FaPlus, FaCheck, FaStar } from "react-icons/fa";
import { useFavorites } from "./FavoritesProvider";

const baseImageUrl = "https://image.tmdb.org/t/p/w500";

// Converts a title to a URL-safe slug
// e.g. "The Dark Knight" → "the-dark-knight"
// e.g. "Spider-Man: No Way Home" → "spider-man-no-way-home"
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars except hyphens
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

export default function MovieCard({ movie }: { movie: any }) {
  const { isFavorite: checkIsFavorite, toggleFavorite: toggle } = useFavorites();
  const mediaType = movie.media_type === "tv" ? "tv" : "movie";
  const isFavorite = checkIsFavorite(movie.id, mediaType);

  const genres =
    movie.genre_ids
      ?.slice(0, 2)
      .map((id: number) => genreMap[id])
      .filter(Boolean)
      .join(", ") || "Movie";

  // Build slug URL: /movie/155-the-dark-knight or /tv/1396-breaking-bad
  const title = movie.title || movie.name || "";
  const slug = title ? `${movie.id}-${toSlug(title)}` : `${movie.id}`;
  const href = movie.media_type === "tv" ? `/tv/${slug}` : `/movie/${slug}`;

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      media_id: movie.id,
      media_type: mediaType,
      title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      genre_ids: movie.genre_ids,
    });
  };

  return (
    <Link
      href={href}
      className="
      relative
      group
      cursor-pointer
      shrink-0
      w-50 md:w-60
      transform
      transition-all
      duration-300
      ease-out
      hover:-translate-y-2
      hover:scale-105
      hover:shadow-[0_10px_40px_rgba(239,68,68,0.35)]
      block
      "
    >
      {/* Poster */}
      <img
        src={`${baseImageUrl}${movie.poster_path}`}
        alt={title}
        className="w-full h-75 md:h-90 object-cover rounded-xl transition-transform duration-300"
      />

      {/* Rating badge */}
      <div className="absolute top-3 right-3 bg-black/90 text-yellow-400 text-sm px-2.5 py-1 rounded-md font-semibold backdrop-blur-sm flex items-center gap-1">
        <FaStar size={11} className="text-yellow-400" />
        {movie.vote_average?.toFixed(1)}
      </div>

      {/* Media type badge */}
      {movie.media_type === "tv" && (
        <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-xs px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
          TV
        </div>
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 rounded-xl bg-linear-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white text-base md:text-lg font-semibold leading-tight">
          {title}
        </h3>
        <p className="text-gray-300 text-sm mt-1 mb-3">{genres}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-md font-medium text-center transition flex items-center justify-center gap-2">
            <FaPlay size={12} />
            Play
          </div>
          <button
            onClick={toggleFavorite}
            className={`px-3 py-2 rounded-md font-semibold transition text-center flex items-center justify-center cursor-pointer ${
              isFavorite
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-700/90 hover:bg-gray-600 text-white"
            }`}
          >
            {isFavorite ? <FaCheck size={14} /> : <FaPlus size={14} />}
          </button>
        </div>
      </div>
    </Link>
  );
}