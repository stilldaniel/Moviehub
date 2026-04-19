"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPlay, FaInfoCircle, FaStar } from "react-icons/fa";

const baseImageUrl = "https://image.tmdb.org/t/p/original";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export default function Hero() {
  const [movie, setMovie] = useState<any>(null);

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`
        );

        const data = await res.json();

        if (data.results?.length > 0) {
          const selectedMovie = data.results[0];

          const detailsRes = await fetch(
            `https://api.themoviedb.org/3/movie/${selectedMovie.id}?api_key=${API_KEY}`
          );

          const detailsData = await detailsRes.json();

          setMovie(detailsData);
        }
      } catch (error) {
        console.error("Hero fetch error:", error);
      }
    }

    fetchMovie();
  }, []);

  if (!movie) {
    return (
      <div className="h-[85vh] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="relative w-full h-[85vh] text-white overflow-hidden">

      {/* Cinematic Background */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `url(${baseImageUrl}${movie.backdrop_path})`,
        }}
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative z-10 flex flex-col justify-center h-full px-6 sm:px-10 md:px-16 max-w-2xl"
      >

        {/* Trending + Rating */}
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-red-600 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-md tracking-wide">
            TRENDING NOW
          </span>
          <span className="text-yellow-400 font-semibold text-sm sm:text-base flex items-center gap-1">
            <FaStar size={14} />
            {movie.vote_average?.toFixed(1) ?? "N/A"}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight">
          {movie.title}
        </h1>

        {/* Description */}
        <p className="text-gray-300 mb-4 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-3 md:line-clamp-none">
          {movie.overview}
        </p>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-gray-400 text-sm mb-6">
          <span>{movie.release_date?.split("-")[0]}</span>
          {movie.runtime && (
            <>
              <span>•</span>
              <span>{movie.runtime} min</span>
            </>
          )}
          {movie.genres?.length > 0 && (
            <>
              <span>•</span>
              <span>
                {movie.genres.slice(0, 2).map((g: any) => g.name).join(", ")}
              </span>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href={`/movie/${movie.id}`}>
            <button className="bg-red-600 hover:bg-red-700 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition cursor-pointer flex items-center gap-2">
              <FaPlay size={14} />
              Watch Now
            </button>
          </Link>

          <Link href={`/movie/${movie.id}`}>
            <button className="bg-gray-700/80 hover:bg-gray-600 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition cursor-pointer flex items-center gap-2">
              <FaInfoCircle size={16} />
              More Info
            </button>
          </Link>
        </div>

      </motion.div>

    </section>
  );
}