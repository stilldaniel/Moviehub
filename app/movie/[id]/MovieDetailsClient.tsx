"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaPlay, FaPlus, FaCheck, FaStar, FaArrowLeft } from "react-icons/fa";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

const imageBaseUrl = "https://image.tmdb.org/t/p/original";
const posterBaseUrl = "https://image.tmdb.org/t/p/w500";

export default function MovieDetailsClient({ movie }: { movie: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const trailer = movie?.videos?.results?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  );

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        checkFavorite(session.user.id);
        fetchUserRating(session.user.id);
        trackWatchHistory(session.user.id);
      }
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const checkFavorite = async (userId: string) => {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("media_id", movie.id)
      .eq("media_type", "movie")
      .limit(1);
    setIsFavorite(data !== null && data.length > 0);
  };

  const fetchUserRating = async (userId: string) => {
    const { data } = await supabase
      .from("ratings")
      .select("rating, review")
      .eq("user_id", userId)
      .eq("media_id", movie.id)
      .eq("media_type", "movie")
      .limit(1);
    if (data && data.length > 0) {
      setUserRating(data[0].rating);
      setReview(data[0].review || "");
      setRatingSubmitted(true);
    }
  };

  const trackWatchHistory = async (userId: string) => {
    // Extract genre_ids from movie.genres (array of {id, name} objects from TMDB)
    const genre_ids: number[] = movie.genres?.map((g: any) => g.id) ?? [];

    // movie.runtime is already in minutes from TMDB (e.g. 148 for a 2h28m film)
    const runtime: number = movie.runtime ?? 120;

    await supabase.from("watch_history").upsert(
      {
        user_id: userId,
        media_id: movie.id,
        media_type: "movie",
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        watched_at: new Date().toISOString(),
        genre_ids,   // e.g. [28, 12, 878]
        runtime,     // full runtime in minutes
        progress: 100, // visiting detail page = counted as fully watched
      },
      { onConflict: "user_id,media_id,media_type" }
    );
  };

  const toggleFavorite = async () => {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }

    if (isFavorite) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("media_id", movie.id)
        .eq("media_type", "movie");
      setIsFavorite(false);
    } else {
      // Save genre_ids to favorites so profile can compute favorite genre
      const genre_ids: number[] = movie.genres?.map((g: any) => g.id) ?? [];
      await supabase.from("favorites").insert({
        user_id: user.id,
        media_id: movie.id,
        media_type: "movie",
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        genre_ids,
      });
      setIsFavorite(true);
    }
  };

  const submitRating = async () => {
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }
    if (userRating === 0) return;

    setSubmittingRating(true);
    await supabase.from("ratings").upsert({
      user_id: user.id,
      media_id: movie.id,
      media_type: "movie",
      title: movie.title,
      poster_path: movie.poster_path,
      rating: userRating,
      review: review,
    }, { onConflict: "user_id,media_id,media_type" });

    setSubmittingRating(false);
    setRatingSubmitted(true);
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Failed to load movie page
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* HERO BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative h-[35vh] sm:h-[45vh] md:h-[55vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${imageBaseUrl}${movie.backdrop_path})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0a] via-transparent to-transparent" />

        <div className="absolute top-20 left-4 sm:left-6 md:left-10 z-10">
          <button
            onClick={() => router.back()}
            className="bg-black/60 hover:bg-black px-3 py-1.5 text-sm rounded-lg transition duration-300 backdrop-blur-sm flex items-center gap-2 cursor-pointer"
          >
            <FaArrowLeft size={12} />
            Back
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="px-4 sm:px-6 md:px-10 lg:px-16 -mt-24 sm:-mt-32 md:-mt-40 relative z-10">
        <div className="flex flex-col sm:flex-row gap-6 md:gap-10">

          {/* POSTER */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="shrink-0 w-36 sm:w-44 md:w-52 lg:w-60"
          >
            <img
              src={`${posterBaseUrl}${movie.poster_path}`}
              alt={movie.title}
              className="w-full rounded-xl shadow-2xl"
            />
          </motion.div>

          {/* INFO */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex-1 pt-2 sm:pt-8 md:pt-16"
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              {movie.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              <span className="bg-yellow-500 text-black px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1">
                <FaStar size={11} />
                {movie.vote_average?.toFixed(1)}
              </span>
              <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">
                {movie.release_date?.split("-")[0]}
              </span>
              <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">
                {movie.runtime} min
              </span>
            </div>

            <div className="flex gap-2 flex-wrap mb-5">
              {movie.genres?.map((genre: any) => (
                <span
                  key={genre.id}
                  className="text-xs sm:text-sm text-gray-300 border border-gray-600 px-2.5 py-0.5 rounded-full"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              {trailer && (
                <Link
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  <FaPlay size={12} />
                  Watch Trailer
                </Link>
              )}
              <button
                onClick={toggleFavorite}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 cursor-pointer ${
                  isFavorite
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                }`}
              >
                {isFavorite ? <FaCheck size={12} /> : <FaPlus size={12} />}
                {isFavorite ? "Saved" : "Watchlist"}
              </button>
            </div>
          </motion.div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 mt-8 border-b border-gray-800 mb-6">
          {["general", "trailer", "ratings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? "text-white border-b-2 border-red-500"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "general" ? "General" : tab === "trailer" ? "Trailer" : "Rate & Review"}
            </button>
          ))}
        </div>

        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12"
          >
            <div className="flex-1">
              <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-3">About</h2>
              <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                {movie.overview}
              </p>
            </div>

            <div className="lg:w-64 xl:w-72 shrink-0 space-y-4">
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Release Year</p>
                <p className="text-white text-sm font-medium">{movie.release_date?.split("-")[0]}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Runtime</p>
                <p className="text-white text-sm font-medium">{movie.runtime} min</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rating</p>
                <p className="text-yellow-400 text-sm font-medium flex items-center gap-1">
                  <FaStar size={11} />
                  {movie.vote_average?.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Genres</p>
                <div className="flex gap-2 flex-wrap">
                  {movie.genres?.map((genre: any) => (
                    <span
                      key={genre.id}
                      className="bg-red-600 px-2 py-0.5 rounded-full text-xs text-white"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TRAILER TAB */}
        {activeTab === "trailer" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            {trailer ? (
              <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No trailer available for this movie.</p>
            )}
          </motion.div>
        )}

        {/* RATINGS TAB */}
        {activeTab === "ratings" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12 max-w-xl"
          >
            {!user ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">Sign in to rate and review this movie</p>
                <Link
                  href="/auth/login"
                  className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Your Rating</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="cursor-pointer transition-transform hover:scale-125"
                      >
                        <FaStar
                          size={24}
                          className={
                            star <= (hoverRating || userRating)
                              ? "text-yellow-400"
                              : "text-gray-600"
                          }
                        />
                      </button>
                    ))}
                    {userRating > 0 && (
                      <span className="text-yellow-400 font-bold text-lg ml-2">
                        {userRating}/10
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Your Review</p>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Write your thoughts about this movie..."
                    rows={4}
                    className="w-full bg-[#141414] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500 transition resize-none"
                  />
                </div>

                <button
                  onClick={submitRating}
                  disabled={userRating === 0 || submittingRating}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2"
                >
                  {submittingRating ? "Saving..." : ratingSubmitted ? "Update Rating" : "Submit Rating"}
                </button>

                {ratingSubmitted && (
                  <p className="text-green-400 text-sm flex items-center gap-2">
                    <FaCheck size={12} />
                    Rating saved successfully!
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}