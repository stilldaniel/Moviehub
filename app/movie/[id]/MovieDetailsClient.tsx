"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaPlay, FaPlus, FaCheck, FaStar, FaArrowLeft, FaShare, FaUser } from "react-icons/fa";
import { supabase, getSafeSession } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useFavorites } from "@/components/FavoritesProvider";
import MovieCard from "@/components/MovieCard";
import { easeSoft } from "@/components/MotionProvider";
import WhereToWatch from "@/components/WhereToWatch";
import { archiveEmbedUrl, freeClassicArchiveId } from "@/lib/freeClassics";

const imageBaseUrl = "https://image.tmdb.org/t/p/original";
const posterBaseUrl = "https://image.tmdb.org/t/p/w500";
const profileBaseUrl = "https://image.tmdb.org/t/p/w185";

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface SimilarMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  genre_ids?: number[];
}

export default function MovieDetailsClient({ movie }: { movie: any }) {
  const router = useRouter();
  // Public-domain films can be watched in full here, so they open on the player
  const archiveId = freeClassicArchiveId(movie.id);
  const [activeTab, setActiveTab] = useState(archiveId ? "watch" : "general");
  const tabs = archiveId ? ["watch", "general", "trailer", "ratings"] : ["general", "trailer", "ratings"];
  const tabLabels: Record<string, string> = { watch: "Watch Free", general: "General", trailer: "Trailer", ratings: "Rate & Review" };
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [shareToast, setShareToast] = useState<"shared" | "copied" | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);
  const { isFavorite: checkIsFavorite, toggleFavorite: toggleFav } = useFavorites();
  const isFavorite = checkIsFavorite(movie.id, "movie");

  const trailer = movie?.videos?.results?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube"
  );

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await getSafeSession(supabase.auth);
      if (session?.user) {
        setUser(session.user);
        fetchUserRating(session.user.id);
      }
    };
    getSession();
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => { setUser(session?.user ?? null); }
    );
    fetchCast();
    fetchSimilar();
    return () => listener.subscription.unsubscribe();
  }, []);

  const fetchCast = async () => {
    try {
      const res = await fetch(`/api/tmdb/movie/${movie.id}/credits`);
      const data = await res.json();
      setCast((data.cast || []).slice(0, 15));
    } catch { /* silently fail */ }
  };

  const fetchSimilar = async () => {
    try {
      const res = await fetch(`/api/tmdb/movie/${movie.id}/similar?page=1`);
      const data = await res.json();
      setSimilar((data.results || []).filter((m: any) => m.poster_path).slice(0, 12));
    } catch { /* silently fail */ }
  };

  const fetchUserRating = async (userId: string) => {
    const { data } = await supabase.from("ratings").select("rating, review")
      .eq("user_id", userId).eq("media_id", movie.id).eq("media_type", "movie").limit(1);
    if (data && data.length > 0) {
      setUserRating(data[0].rating);
      setReview(data[0].review || "");
      setRatingSubmitted(true);
    }
  };

  // Record a view only when the user actually plays the trailer (the only playback the app offers)
  const trackedRef = useRef(false);
  const trackWatchHistory = async () => {
    if (!user || trackedRef.current) return;
    trackedRef.current = true;
    const userId = user.id;
    const genre_ids: number[] = movie.genres?.map((g: any) => g.id) ?? [];
    const runtime: number = movie.runtime ?? 120;
    await supabase.from("watch_history").upsert(
      { user_id: userId, media_id: movie.id, media_type: "movie", title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average, watched_at: new Date().toISOString(), genre_ids, runtime, progress: 100 },
      { onConflict: "user_id,media_id,media_type" }
    );
  };

  const toggleFavorite = () =>
    toggleFav({
      media_id: movie.id, media_type: "movie", title: movie.title, poster_path: movie.poster_path,
      vote_average: movie.vote_average, genre_ids: movie.genres?.map((g: any) => g.id) ?? [],
    });

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: movie.title, text: `Check out ${movie.title} on MovieApp!`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); setShareToast("shared"); } catch { return; }
    } else {
      try { await navigator.clipboard.writeText(url); setShareToast("copied"); }
      catch { window.prompt("Copy this link:", url); return; }
    }
    setTimeout(() => setShareToast(null), 2500);
  };

  const submitRating = async () => {
    if (!user) { window.location.href = "/auth/login"; return; }
    if (userRating === 0) return;
    setSubmittingRating(true);
    setRatingError("");
    const { error } = await supabase.from("ratings").upsert({ user_id: user.id, media_id: movie.id, media_type: "movie", title: movie.title, poster_path: movie.poster_path, rating: userRating, review }, { onConflict: "user_id,media_id,media_type" });
    setSubmittingRating(false);
    if (error) { setRatingError(`Couldn't save your rating: ${error.message}`); return; }
    setRatingSubmitted(true);
  };

  if (!movie) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">Failed to load movie page</div>
  );

  return (
    <div className="bg-[#0a0a0a] text-white">

      {/* Share toast */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a] border border-gray-700 text-white text-sm px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <FaCheck size={12} className="text-green-400" />
          {shareToast === "shared" ? "Shared successfully!" : "Link copied to clipboard!"}
        </div>
      )}

      {/* HERO BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, ease: "easeOut" }}
        className="relative h-[35vh] sm:h-[45vh] md:h-[55vh] bg-cover bg-center"
        style={{ backgroundImage: `url(${imageBaseUrl}${movie.backdrop_path})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute top-20 left-4 sm:left-6 md:left-10 z-10">
          <button onClick={() => router.back()} className="bg-black/60 hover:bg-black px-3 py-1.5 text-sm rounded-lg transition backdrop-blur-sm flex items-center gap-2 cursor-pointer">
            <FaArrowLeft size={12} /> Back
          </button>
        </div>
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="px-4 sm:px-3 md:px-1 lg:px-1 -mt-24 sm:-mt-32 md:-mt-40 relative z-10">

        {/* Poster + Info */}
        <div className="flex flex-col sm:flex-row gap-6 md:gap-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: easeSoft }} className="shrink-0 w-36 sm:w-44 md:w-52 lg:w-60">
            <img src={`${posterBaseUrl}${movie.poster_path}`} alt={movie.title} className="w-full rounded-xl shadow-2xl" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: easeSoft }} className="flex-1 pt-2 sm:pt-8 md:pt-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              <span className="bg-yellow-500 text-black px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1"><FaStar size={11} />{movie.vote_average?.toFixed(1)}</span>
              <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">{movie.release_date?.split("-")[0]}</span>
              <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">{movie.runtime} min</span>
            </div>
            <div className="flex gap-2 flex-wrap mb-5">
              {movie.genres?.map((genre: any) => (
                <span key={genre.id} className="text-xs sm:text-sm text-gray-300 border border-gray-600 px-2.5 py-0.5 rounded-full">{genre.name}</span>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              {archiveId && (
                <button
                  onClick={() => { setActiveTab("watch"); trackWatchHistory(); document.getElementById("details-tabs")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-medium transition duration-300 ease-soft active:scale-[0.97] flex items-center gap-2 cursor-pointer"
                >
                  <FaPlay size={12} /> Watch Free
                </button>
              )}
              {trailer && (
                <Link href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" onClick={trackWatchHistory} className={`${archiveId ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"} px-5 py-2 rounded-lg text-sm font-medium transition duration-300 ease-soft active:scale-[0.97] flex items-center gap-2`}>
                  <FaPlay size={12} /> Watch Trailer
                </Link>
              )}
              <button onClick={toggleFavorite} className={`px-5 py-2 rounded-lg text-sm font-medium transition duration-300 ease-soft active:scale-[0.97] flex items-center gap-2 cursor-pointer ${isFavorite ? "bg-red-600 hover:bg-red-700" : "bg-gray-700 hover:bg-gray-600"} text-white`}>
                {isFavorite ? <FaCheck size={12} /> : <FaPlus size={12} />}
                {isFavorite ? "Saved" : "Watchlist"}
              </button>
              <button onClick={handleShare} className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition duration-300 ease-soft active:scale-[0.97] flex items-center gap-2 cursor-pointer">
                <FaShare size={12} /> Share
              </button>
            </div>
            <WhereToWatch mediaType="movie" id={movie.id} />
          </motion.div>
        </div>

        {/* TABS */}
        <div id="details-tabs" className="flex gap-6 mt-8 border-b border-gray-800 mb-6 scroll-mt-24">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); if ((tab === "trailer" && trailer) || tab === "watch") trackWatchHistory(); }}
              className={`relative pb-3 text-sm font-medium capitalize transition-colors duration-300 cursor-pointer ${activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {tabLabels[tab]}
              {activeTab === tab && (
                <motion.span layoutId="details-tab-underline" transition={{ duration: 0.45, ease: easeSoft }} className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-red-500" />
              )}
            </button>
          ))}
        </div>

        {/* GENERAL TAB */}
        {activeTab === "general" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeSoft }}>
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12">
              <div className="flex-1">
                <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-3">About</h2>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{movie.overview}</p>
              </div>
              <div className="lg:w-64 xl:w-72 shrink-0 space-y-4">
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Release Year</p><p className="text-white text-sm font-medium">{movie.release_date?.split("-")[0]}</p></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Runtime</p><p className="text-white text-sm font-medium">{movie.runtime} min</p></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rating</p><p className="text-yellow-400 text-sm font-medium flex items-center gap-1"><FaStar size={11} />{movie.vote_average?.toFixed(1)}</p></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Genres</p>
                  <div className="flex gap-2 flex-wrap">{movie.genres?.map((genre: any) => (<span key={genre.id} className="bg-red-600 px-2 py-0.5 rounded-full text-xs text-white">{genre.name}</span>))}</div>
                </div>
              </div>
            </div>

            {/* CAST */}
            {cast.length > 0 && (
              <div className="mb-12">
                <h2 className="text-lg font-semibold mb-4">Cast</h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {cast.map((member) => (
                    <div key={member.id} className="shrink-0 rounded-xl overflow-hidden bg-[#181818] hover:bg-[#222] transition duration-300 ease-soft hover:-translate-y-1 hover:shadow-lg hover:shadow-black/50" style={{ width: 120 }}>
                      <div className="relative w-full" style={{ paddingBottom: "120%" }}>
                        {member.profile_path
                          ? <img src={`${profileBaseUrl}${member.profile_path}`} alt={member.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                          : <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-600"><FaUser size={32} /></div>}
                      </div>
                      <div className="p-2.5">
                        <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{member.name}</p>
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-snug">{member.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* WATCH TAB — full public-domain film from the Internet Archive */}
        {activeTab === "watch" && archiveId && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeSoft }} className="mb-12">
            <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-lg">
              <iframe
                src={archiveEmbedUrl(archiveId)}
                title={`Watch ${movie.title}`}
                className="w-full h-full"
                allow="fullscreen"
                allowFullScreen
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {movie.title} is in the public domain. Streaming from the{" "}
              <a href={`https://archive.org/details/${archiveId}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
                Internet Archive
              </a>.
            </p>
          </motion.div>
        )}

        {/* TRAILER TAB */}
        {activeTab === "trailer" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeSoft }} className="mb-12">
            {trailer
              ? <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl shadow-lg"><iframe src={`https://www.youtube.com/embed/${trailer.key}`} className="w-full h-full" allowFullScreen /></div>
              : <p className="text-gray-500 text-sm">No trailer available for this movie.</p>}
          </motion.div>
        )}

        {/* RATINGS TAB */}
        {activeTab === "ratings" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeSoft }} className="mb-12 max-w-xl">
            {!user ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">Sign in to rate and review this movie</p>
                <Link href="/auth/login" className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-sm font-medium transition">Sign In</Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Your Rating</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1,2,3,4,5,6,7,8,9,10].map((star) => (
                      <button key={star} onClick={() => setUserRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="cursor-pointer transition-transform hover:scale-125">
                        <FaStar size={24} className={star <= (hoverRating || userRating) ? "text-yellow-400" : "text-gray-600"} />
                      </button>
                    ))}
                    {userRating > 0 && <span className="text-yellow-400 font-bold text-lg ml-2">{userRating}/10</span>}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Your Review</p>
                  <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write your thoughts about this movie..." rows={4} className="w-full bg-[#141414] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500 transition resize-none" />
                </div>
                <button onClick={submitRating} disabled={userRating === 0 || submittingRating} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2">
                  {submittingRating ? "Saving..." : ratingSubmitted ? "Update Rating" : "Submit Rating"}
                </button>
                {ratingSubmitted && <p className="text-green-400 text-sm flex items-center gap-2"><FaCheck size={12} /> Rating saved successfully!</p>}
                {ratingError && <p className="text-red-400 text-sm">{ratingError}</p>}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SIMILAR MOVIES ── */}
        {similar.length > 0 && (
          <div className="pt-8 pb-12 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-5">More Like This</h2>
            <div className="poster-row">
              {similar.map((item, i) => (
                <MovieCard key={item.id} movie={{ ...item, media_type: "movie" }} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}