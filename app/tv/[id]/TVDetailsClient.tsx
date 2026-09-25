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

const imageBaseUrl = "https://image.tmdb.org/t/p/original";
const posterBaseUrl = "https://image.tmdb.org/t/p/w500";
const profileBaseUrl = "https://image.tmdb.org/t/p/w185";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface SimilarShow {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids?: number[];
}

export default function TVDetailsClient({ show }: { show: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("general");
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [shareToast, setShareToast] = useState<"shared" | "copied" | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<SimilarShow[]>([]);
  const { isFavorite: checkIsFavorite, toggleFavorite: toggleFav } = useFavorites();
  const isFavorite = checkIsFavorite(show.id, "tv");

  const trailer = show?.videos?.results?.find(
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
      const res = await fetch(`https://api.themoviedb.org/3/tv/${show.id}/credits?api_key=${API_KEY}`);
      const data = await res.json();
      setCast((data.cast || []).slice(0, 15));
    } catch { /* silently fail */ }
  };

  const fetchSimilar = async () => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${show.id}/similar?api_key=${API_KEY}&page=1`);
      const data = await res.json();
      setSimilar((data.results || []).filter((s: any) => s.poster_path).slice(0, 12));
    } catch { /* silently fail */ }
  };

  const fetchUserRating = async (userId: string) => {
    const { data } = await supabase.from("ratings").select("rating, review")
      .eq("user_id", userId).eq("media_id", show.id).eq("media_type", "tv").limit(1);
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
    const genre_ids: number[] = show.genres?.map((g: any) => g.id) ?? [];
    const runtime: number = show.episode_run_time?.[0] ?? 45;
    await supabase.from("watch_history").upsert(
      { user_id: userId, media_id: show.id, media_type: "tv", title: show.name, poster_path: show.poster_path, vote_average: show.vote_average, watched_at: new Date().toISOString(), genre_ids, runtime, progress: 100 },
      { onConflict: "user_id,media_id,media_type" }
    );
  };

  const toggleFavorite = () =>
    toggleFav({
      media_id: show.id, media_type: "tv", title: show.name, poster_path: show.poster_path,
      vote_average: show.vote_average, genre_ids: show.genres?.map((g: any) => g.id) ?? [],
    });

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = { title: show.name, text: `Check out ${show.name} on MovieApp!`, url };
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
    await supabase.from("ratings").upsert({ user_id: user.id, media_id: show.id, media_type: "tv", title: show.name, poster_path: show.poster_path, rating: userRating, review }, { onConflict: "user_id,media_id,media_type" });
    setSubmittingRating(false);
    setRatingSubmitted(true);
  };

  if (!show) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">Failed to load TV show page</div>
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
        style={{ backgroundImage: `url(${imageBaseUrl}${show.backdrop_path})` }}
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
      <div className="px-4 sm:px-6 md:px-1 lg:px-1 -mt-24 sm:-mt-32 md:-mt-40 relative z-10">

        {/* Poster + Info */}
        <div className="flex flex-col sm:flex-row gap-6 md:gap-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: easeSoft }} className="shrink-0 w-36 sm:w-44 md:w-52 lg:w-60">
            <img src={`${posterBaseUrl}${show.poster_path}`} alt={show.name} className="w-full rounded-xl shadow-2xl" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1, ease: easeSoft }} className="flex-1 pt-2 sm:pt-8 md:pt-16">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">{show.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
              <span className="bg-yellow-500 text-black px-2.5 py-0.5 rounded-md font-bold flex items-center gap-1"><FaStar size={11} />{show.vote_average?.toFixed(1)}</span>
              <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">{show.first_air_date?.split("-")[0]}</span>
              <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">{show.number_of_seasons} Season{show.number_of_seasons > 1 ? "s" : ""}</span>
              <span className="bg-blue-600 px-2.5 py-0.5 rounded-md text-white text-xs font-medium">TV Show</span>
            </div>
            <div className="flex gap-2 flex-wrap mb-5">
              {show.genres?.map((genre: any) => (
                <span key={genre.id} className="text-xs sm:text-sm text-gray-300 border border-gray-600 px-2.5 py-0.5 rounded-full">{genre.name}</span>
              ))}
            </div>
            <div className="flex gap-3 flex-wrap">
              {trailer && (
                <Link href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" onClick={trackWatchHistory} className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-medium transition duration-300 ease-soft active:scale-[0.97] flex items-center gap-2">
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
          </motion.div>
        </div>

        {/* TABS */}
        <div className="flex gap-6 mt-8 border-b border-gray-800 mb-6">
          {["general", "trailer", "ratings"].map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "trailer" && trailer) trackWatchHistory(); }}
              className={`relative pb-3 text-sm font-medium capitalize transition-colors duration-300 cursor-pointer ${activeTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {tab === "general" ? "General" : tab === "trailer" ? "Trailer" : "Rate & Review"}
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
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{show.overview}</p>
              </div>
              <div className="lg:w-64 xl:w-72 shrink-0 space-y-4">
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">First Air Date</p><p className="text-white text-sm font-medium">{show.first_air_date?.split("-")[0]}</p></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Seasons</p><p className="text-white text-sm font-medium">{show.number_of_seasons}</p></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Episodes</p><p className="text-white text-sm font-medium">{show.number_of_episodes}</p></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Rating</p><p className="text-yellow-400 text-sm font-medium flex items-center gap-1"><FaStar size={11} />{show.vote_average?.toFixed(1)}</p></div>
                <div><p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Status</p><p className="text-white text-sm font-medium">{show.status}</p></div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Genres</p>
                  <div className="flex gap-2 flex-wrap">{show.genres?.map((genre: any) => (<span key={genre.id} className="bg-red-600 px-2 py-0.5 rounded-full text-xs text-white">{genre.name}</span>))}</div>
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

        {/* TRAILER TAB */}
        {activeTab === "trailer" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeSoft }} className="mb-12">
            {trailer
              ? <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl shadow-lg"><iframe src={`https://www.youtube.com/embed/${trailer.key}`} className="w-full h-full" allowFullScreen /></div>
              : <p className="text-gray-500 text-sm">No trailer available for this show.</p>}
          </motion.div>
        )}

        {/* RATINGS TAB */}
        {activeTab === "ratings" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: easeSoft }} className="mb-12 max-w-xl">
            {!user ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">Sign in to rate and review this show</p>
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
                  <textarea value={review} onChange={(e) => setReview(e.target.value)} placeholder="Write your thoughts about this show..." rows={4} className="w-full bg-[#141414] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500 transition resize-none" />
                </div>
                <button onClick={submitRating} disabled={userRating === 0 || submittingRating} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition cursor-pointer flex items-center gap-2">
                  {submittingRating ? "Saving..." : ratingSubmitted ? "Update Rating" : "Submit Rating"}
                </button>
                {ratingSubmitted && <p className="text-green-400 text-sm flex items-center gap-2"><FaCheck size={12} /> Rating saved successfully!</p>}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SIMILAR SHOWS ── */}
        {similar.length > 0 && (
          <div className="pt-8 pb-12 border-t border-gray-800">
            <h2 className="text-xl font-semibold mb-5">More Like This</h2>
            <div className="poster-row">
              {similar.map((item, i) => (
                <MovieCard key={item.id} movie={{ ...item, media_type: "tv" }} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}