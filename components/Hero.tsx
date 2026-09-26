"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaInfoCircle, FaStar } from "react-icons/fa";
import { easeSoft } from "./MotionProvider";
import { mediaHref } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { containerClasses } from "@/components/ui/Container";
import { SkeletonBlock } from "@/components/ui/Skeleton";

// Text blocks rise in one after another once the backdrop has started to settle
const content = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.25 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easeSoft } },
};

const baseImageUrl = "https://image.tmdb.org/t/p/w1280"; // not "original": that can be a multi-MB 4K image

export default function Hero() {
  const [movie, setMovie] = useState<any>(null);

  useEffect(() => {
    async function fetchMovie() {
      try {
        const res = await fetch(
          `/api/tmdb/movie/popular`
        );

        const data = await res.json();

        if (data.results?.length > 0) {
          const selectedMovie = data.results[0];

          const detailsRes = await fetch(
            `/api/tmdb/movie/${selectedMovie.id}`
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
      // Same shape as the loaded banner, so nothing jumps when it arrives
      <section aria-busy="true" aria-label="Loading featured movie" className="relative h-[85vh] overflow-hidden bg-surface">
        <div className="absolute inset-0 bg-linear-to-t from-canvas via-transparent to-transparent" />
        <div className={`${containerClasses} relative flex h-full flex-col justify-center gap-4`}>
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-12 w-full max-w-lg" />
          <SkeletonBlock className="h-4 w-full max-w-xl" />
          <SkeletonBlock className="h-4 w-full max-w-md" />
          <div className="mt-4 flex gap-3">
            <SkeletonBlock className="h-12 w-36 rounded-xl" />
            <SkeletonBlock className="h-12 w-32 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-[85vh] text-white overflow-hidden">

      {/* Cinematic Background */}
      <motion.div
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ opacity: { duration: 0.9, ease: "easeOut" }, scale: { duration: 2.4, ease: easeSoft } }}
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${baseImageUrl}${movie.backdrop_path})`,
        }}
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-linear-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <motion.div
        variants={content}
        initial="hidden"
        animate="show"
        className={`${containerClasses} relative z-10 flex flex-col justify-center h-full`}
      >

        {/* Trending + Rating */}
        <motion.div variants={item} className="flex items-center gap-3 mb-3">
          <span className="bg-brand text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-md tracking-wide">
            TRENDING NOW
          </span>
          <span className="text-yellow-400 font-semibold text-sm sm:text-base flex items-center gap-1">
            <FaStar size={14} />
            {movie.vote_average?.toFixed(1) ?? "N/A"}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1 variants={item} className="max-w-2xl text-3xl sm:text-4xl md:text-6xl font-bold mb-4 leading-tight tracking-tight">
          {movie.title}
        </motion.h1>

        {/* Description */}
        <motion.p variants={item} className="max-w-2xl text-fg-soft mb-4 text-sm sm:text-base md:text-lg leading-relaxed line-clamp-3 md:line-clamp-none">
          {movie.overview}
        </motion.p>

        {/* Metadata */}
        <motion.div variants={item} className="flex flex-wrap items-center gap-3 text-fg-muted text-sm mb-6">
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
        </motion.div>

        {/* Buttons */}
        <motion.div variants={item} className="flex flex-wrap gap-3">
          <Button href={`${mediaHref("movie", movie.id, movie.title)}#where-to-watch`} size="lg" icon={<FaPlay size={14} />}>
            Watch now
          </Button>
          <Button href={mediaHref("movie", movie.id, movie.title)} size="lg" variant="secondary" className="bg-control/80 backdrop-blur" icon={<FaInfoCircle size={16} />}>
            More info
          </Button>
        </motion.div>

      </motion.div>

    </section>
  );
}