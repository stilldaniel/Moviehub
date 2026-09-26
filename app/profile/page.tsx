"use client";

import { useEffect, useState, useRef } from "react";
import { supabase, getSafeSession } from "@/lib/supabase";
import Link from "next/link";
import { mediaHref } from "@/lib/utils";
import {
  FaEdit, FaHistory, FaTrash, FaCamera,
  FaLock, FaSignOutAlt, FaCheck, FaTimes,
  FaThLarge, FaBookmark, FaCog, FaCalendarAlt,
  FaGift, FaCrown, FaUser, FaFire, FaFilm,
} from "react-icons/fa";
import { MdOutlineWatchLater } from "react-icons/md";
import MovieCard from "@/components/MovieCard";
import { fetchRuntime } from "@/lib/tmdb";

const baseImageUrl = "https://image.tmdb.org/t/p/w500";

const formatRuntime = (mins?: number | null) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60); const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [favoriteGenre, setFavoriteGenre] = useState<string>("—");

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await getSafeSession(supabase.auth);
      if (!session?.user) { window.location.href = "/auth/login"; return; }
      setUser(session.user);
      fetchProfile(session.user.id, session.user);
      fetchFavorites(session.user.id);
      fetchHistory(session.user.id);
      fetchRatings(session.user.id);
      updateAndFetchStreak(session.user.id);
    };
    getSession();
  }, []);

  const updateAndFetchStreak = async (userId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase.from("profiles").select("last_login, streak_count").eq("id", userId).maybeSingle();
      if (error) { console.error("Streak fetch error:", error.message); return; }
      const currentStreak: number = data?.streak_count ?? 0;
      if (data?.last_login) {
        const lastLogin = new Date(data.last_login);
        lastLogin.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today.getTime() - lastLogin.getTime()) / 86_400_000);
        if (diffDays === 0) { setStreak(currentStreak); return; }
        const newStreak = diffDays === 1 ? currentStreak + 1 : 1;
        const { error: updateError } = await supabase.from("profiles").update({ last_login: today.toISOString(), streak_count: newStreak }).eq("id", userId);
        if (updateError) console.error("Streak update error:", updateError.message);
        else setStreak(newStreak);
      } else {
        const { error: updateError } = await supabase.from("profiles").update({ last_login: today.toISOString(), streak_count: 1 }).eq("id", userId);
        if (updateError) console.error("Streak init error:", updateError.message);
        else setStreak(1);
      }
    } catch (err) { console.error("Streak error:", err); }
  };

  const fetchProfile = async (userId: string, sessionUser: any) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).limit(1);
    if (data && data.length > 0) {
      const p = { ...data[0], avatar_url: data[0].avatar_url || sessionUser?.user_metadata?.avatar_url || null };
      setProfile(p);
      setNewName(p.full_name || sessionUser?.user_metadata?.full_name || "");
      setNewUsername(p.username || "");
    } else {
      await supabase.from("profiles").insert({ id: userId });
      const d = { id: userId, full_name: sessionUser?.user_metadata?.full_name || "", avatar_url: sessionUser?.user_metadata?.avatar_url || null, username: "" };
      setProfile(d); setNewName(d.full_name);
    }
    setLoading(false);
  };

  const fetchFavorites = async (userId: string) => {
    const { data } = await supabase.from("favorites").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setFavorites(data || []);
  };

  const GENRE_MAP: Record<number, string> = {
    28:"Action",12:"Adventure",16:"Animation",35:"Comedy",80:"Crime",99:"Documentary",18:"Drama",
    10751:"Family",14:"Fantasy",36:"History",27:"Horror",10402:"Music",9648:"Mystery",10749:"Romance",
    878:"Sci-Fi",53:"Thriller",10752:"War",37:"Western",10759:"Action & Adventure",10762:"Kids",
    10763:"News",10764:"Reality",10765:"Sci-Fi & Fantasy",10766:"Soap",10767:"Talk",10768:"War & Politics",
  };

  const fetchHistory = async (userId: string) => {
    const { data } = await supabase.from("watch_history").select("*").eq("user_id", userId).order("watched_at", { ascending: false });
    const items = data || [];
    setHistory(items);
    const genreCounts: Record<number, number> = {};
    items.forEach((item: any) => { (item.genre_ids || []).forEach((id: number) => { genreCounts[id] = (genreCounts[id] || 0) + 1; }); });
    const topId = Object.keys(genreCounts).sort((a, b) => genreCounts[Number(b)] - genreCounts[Number(a)])[0];
    setFavoriteGenre(topId && GENRE_MAP[Number(topId)] ? GENRE_MAP[Number(topId)] : "—");
    backfillRuntimes(items);
  };

  // Older history entries were saved without a runtime: look them up on TMDB once and save them back
  const backfillRuntimes = async (items: any[]) => {
    const missing = items.filter((item) => !(item.runtime > 0));
    if (missing.length === 0) return;
    const found = (
      await Promise.all(missing.map(async (item) => ({ id: item.id, runtime: await fetchRuntime(item.media_id, item.media_type) })))
    ).filter((f): f is { id: string; runtime: number } => f.runtime !== null);
    if (found.length === 0) return;
    const byId = new Map(found.map((f) => [f.id, f.runtime]));
    setHistory((prev) => prev.map((item) => (byId.has(item.id) ? { ...item, runtime: byId.get(item.id) } : item)));
    const results = await Promise.all(found.map((f) => supabase.from("watch_history").update({ runtime: f.runtime }).eq("id", f.id)));
    results.forEach(({ error }) => { if (error) console.error("Runtime backfill error:", error.message); });
  };

  const fetchRatings = async (userId: string) => {
    const { data } = await supabase.from("ratings").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setRatings(data || []);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id, full_name: newName, username: newUsername, updated_at: new Date().toISOString(),
    });
    if (error) setSaveMessage("Error saving");
    else { setSaveMessage("Saved!"); setProfile((prev: any) => ({ ...prev, full_name: newName, username: newUsername })); setEditingName(false); }
    setSaving(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
    if (uploadError) { setSaveMessage("Upload error"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const avatarUrl = urlData.publicUrl;
    await supabase.from("profiles").upsert({ id: user.id, avatar_url: avatarUrl });
    await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
    setSaveMessage("Picture updated!"); setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { setPasswordMessage("Passwords do not match"); return; }
    if (newPassword.length < 6) { setPasswordMessage("Min 6 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setPasswordMessage(error.message);
    else { setPasswordMessage("Password updated!"); setNewPassword(""); setConfirmPassword(""); setChangingPassword(false); }
    setTimeout(() => setPasswordMessage(""), 3000);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/auth/login"; };
  // Deletes the user's data and auth account via the delete_own_account() database function
  const handleDeleteAccount = async () => {
    if (!user || deleteInProgress) return;
    setDeleteInProgress(true);
    setDeleteError("");
    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      setDeleteError(`Couldn't delete your account: ${error.message}`);
      setDeleteInProgress(false);
      return;
    }
    // Best effort: remove the uploaded avatar too
    const { data: files } = await supabase.storage.from("avatars").list("", { search: user.id });
    if (files?.length) await supabase.storage.from("avatars").remove(files.map((f: { name: string }) => f.name));
    await supabase.auth.signOut();
    window.location.href = "/auth/signup";
  };

  const removeFavorite = (item: any) =>
    setFavorites((prev) => prev.filter((f) => !(f.media_id === item.media_id && f.media_type === item.media_type)));

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today"; if (days === 1) return "1 day ago";
    if (days < 7) return `${days} days ago`; if (days < 14) return "1 week ago";
    return `${Math.floor(days / 7)} weeks ago`;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "4px solid #dc2626", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "User";
  const userInitial = displayName[0]?.toUpperCase() || "U";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "2024";

  const stats = [
    { value: history.length, label: "Watched" },
    { value: favorites.length, label: "My List" },
    {
      value: (() => {
        // Combined length of every title in the history (one episode for TV shows)
        const totalMins = history.reduce((acc, item) => acc + (item.runtime > 0 ? item.runtime : 0), 0);
        if (totalMins === 0) return "0h";
        const h = Math.floor(totalMins / 60); const m = totalMins % 60;
        return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
      })(),
      label: "Total Runtime",
    },
    { value: ratings.length, label: "Reviews" },
  ];

  const sidebarLinks = [
    { key: "overview",  label: "Overview",      icon: <FaThLarge size={14} /> },
    { key: "favorites", label: "My List",        icon: <FaBookmark size={14} /> },
    { key: "history",   label: "Watch History",  icon: <MdOutlineWatchLater size={16} /> },
    { key: "settings",  label: "Settings",       icon: <FaCog size={14} /> },
  ];

  const plans = [
    { name: "Free",     price: "Free",   priceUnit: "",    current: true,  features: ["HD quality","1 screen","Mobile only","Trailers only"] },
    { name: "Basic",    price: "$6.99",  priceUnit: "/mo", current: false, features: ["Full HD","1 screen","Mobile & Tablet","All Content"] },
    { name: "Standard", price: "$10.99", priceUnit: "/mo", current: false, features: ["Full HD","2 screens","Download on 2","All Content"] },
    { name: "Premium",  price: "$14.99", priceUnit: "/mo", current: false, features: ["4K + HDR","4 screens","Download on 6","All Content"] },
  ];

  /* ── Shared poster card (a plain function, not a component, so cards don't remount on every render) ── */
  const renderPoster = (item: any, index: number) => (
    <MovieCard
      key={item.id}
      variant="grid"
      index={index}
      movie={{ id: item.media_id, media_type: item.media_type, title: item.title, poster_path: item.poster_path, vote_average: item.vote_average, genre_ids: item.genre_ids }}
      onFavoriteChange={(isFavorite) => { if (!isFavorite) removeFavorite(item); }}
    />
  );

  /* ── Shared progress row ── */
  const ProgressRow = ({ item, index, total }: { item: any; index: number; total: number }) => {
    const progress: number | null = typeof item.progress === "number" && item.progress < 100 ? item.progress : null;
    const runtime = formatRuntime(item.runtime);
    return (
      <Link href={mediaHref(item.media_type, item.media_id, item.title)}>
        <div style={{ paddingTop: 14, paddingBottom: 14, borderBottom: index < total - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 52, height: 68, borderRadius: 7, overflow: "hidden", flexShrink: 0 }}>
              {item.poster_path
                ? <img src={`${baseImageUrl}${item.poster_path}`} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}><FaFilm style={{ color: "rgba(255,255,255,0.2)" }} size={16} /></div>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ marginBottom: 5 }}>
                <span style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4 }}>
                  {item.media_type === "tv" ? "TV Show" : "Movie"}
                </span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: "0 0 3px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
                {timeAgo(item.watched_at ?? item.created_at)}{runtime && ` · ${runtime}`}
              </p>
            </div>
          </div>
          {progress !== null && <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: `${progress}%`, height: "100%", background: "#dc2626", borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", minWidth: 30, textAlign: "right", flexShrink: 0 }}>{progress}%</span>
          </div>}
        </div>
      </Link>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>

      <style>{`
        /* ── Outer wrappers ── */
        .prof-outer { max-width:1280px; margin:0 auto; padding:12px 14px 0; }
        .prof-body  { max-width:1280px; margin:0 auto; padding:0 14px 52px; }
        @media(min-width:640px){
          .prof-outer{padding:20px 24px 0;}
          .prof-body {padding:0 24px 52px;}
        }
        @media(min-width:1024px){
          .prof-outer{padding:24px 32px 0;}
          .prof-body {padding:0 32px 52px;}
        }

        /* ── Hero ── */
        .prof-hero{
          position:relative;overflow:hidden;border-radius:18px;
          margin-bottom:20px;margin-top:60px;
          background:linear-gradient(135deg,#280838 0%,#3a0a18 30%,#220414 60%,#110820 100%);
        }
        @media(min-width:1024px){.prof-hero{margin-top:64px;border-radius:20px;margin-bottom:28px;}}

        /* ── Hero inner ── */
        .prof-hero-inner{position:relative;padding:20px 16px 0;}
        @media(min-width:640px){.prof-hero-inner{padding:32px 24px 0;}}
        @media(min-width:1024px){.prof-hero-inner{padding:40px 32px 0;}}

        /* ── Hero top row ──
           Mobile  : 2-column grid (avatar | info), edit-btn full row below
           Desktop : flex row
        */
        .prof-hero-row{
          display:grid;
          grid-template-columns:88px 1fr;
          grid-template-rows:auto auto;
          column-gap:14px;
          row-gap:12px;
        }
        .prof-avatar-wrap{grid-column:1;grid-row:1;}
        .prof-hero-info  {grid-column:2;grid-row:1;min-width:0;padding-top:2px;}
        .prof-edit-btn{
          grid-column:1/3;grid-row:2;
          display:flex;align-items:center;justify-content:center;gap:7px;
          width:100%;padding:9px 16px;border-radius:10px;box-sizing:border-box;
          background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);
          color:rgba(255,255,255,0.8);font-size:13px;font-weight:500;
          cursor:pointer;white-space:nowrap;transition:all 0.15s;
        }
        .prof-edit-btn:hover{background:rgba(255,255,255,0.14);color:#fff;}
        @media(min-width:768px){
          .prof-hero-row{display:flex;flex-direction:row;align-items:flex-start;gap:24px;}
          .prof-avatar-wrap{flex-shrink:0;}
          .prof-hero-info{flex:1;padding-top:4px;}
          .prof-edit-btn{width:auto;grid-column:unset;grid-row:unset;justify-content:flex-start;align-self:flex-start;padding:10px 20px;font-size:14px;margin-top:4px;}
        }
        @media(min-width:1024px){.prof-hero-row{gap:28px;}}

        /* ── Stats bar ── */
        .prof-stats{
          display:flex;align-items:stretch;
          margin-top:18px;padding-top:16px;padding-bottom:20px;
          border-top:1px solid rgba(255,255,255,0.1);
        }
        .prof-stat-cell{display:flex;align-items:center;flex:1;min-width:0;}
        .prof-stat-inner{flex:1;text-align:center;padding:0 4px;}
        .prof-stat-val{font-size:18px;font-weight:800;color:#fff;margin:0;line-height:1.1;}
        .prof-stat-lbl{font-size:10px;color:rgba(255,255,255,0.4);margin:4px 0 0;white-space:nowrap;}
        .prof-stat-div{width:1px;height:26px;background:rgba(255,255,255,0.12);flex-shrink:0;align-self:center;}
        @media(min-width:480px){
          .prof-stat-val{font-size:20px;}
          .prof-stat-lbl{font-size:11px;}
          .prof-stat-inner{padding:0 10px;}
        }
        @media(min-width:768px){
          .prof-stat-val{font-size:22px;}
          .prof-stat-inner{padding:0 24px;}
          .prof-stats{margin-top:28px;padding-top:20px;padding-bottom:24px;}
        }
        @media(min-width:1024px){
          .prof-stat-val{font-size:24px;}
          .prof-stat-inner{padding:0 40px;}
          .prof-stats{margin-top:36px;padding-top:24px;padding-bottom:28px;}
          .prof-stat-div{height:32px;}
        }

        /* ── Body layout ── */
        .prof-body-row{display:flex;flex-direction:column;gap:12px;align-items:stretch;}
        @media(min-width:1024px){.prof-body-row{flex-direction:row;gap:24px;align-items:flex-start;}}

        /* ── Desktop sidebar ── */
        .prof-sidebar{width:280px;min-width:280px;flex-shrink:0;display:none;}
        .prof-sidebar-card{background:#141414;border-radius:16px;position:sticky;top:88px;overflow:hidden;}
        .prof-sidebar-btn{
          width:100%;display:flex;align-items:center;gap:12px;
          padding:13px 16px;border-radius:12px;border:none;cursor:pointer;
          margin-bottom:2px;font-size:15px;font-weight:500;transition:all 0.15s;text-align:left;
        }
        .prof-sidebar-meta-row{
          display:flex;justify-content:space-between;align-items:center;
          padding:11px 20px;border-bottom:1px solid rgba(255,255,255,0.05);
        }
        .prof-sidebar-meta-row:last-child{border-bottom:none;}
        @media(min-width:1024px){.prof-sidebar{display:block;}}

        /* ── Mobile nav: 2×2 grid (no scroll) ── */
        .prof-tabbar{display:block;width:100%;}
        .prof-tab-grid{
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:6px;
        }
        .prof-tab-btn{
          display:flex;align-items:center;justify-content:center;gap:7px;
          padding:11px 8px;border-radius:10px;border:none;cursor:pointer;
          font-size:12px;font-weight:500;transition:all 0.15s;
          white-space:nowrap;
        }
        @media(min-width:480px){
          .prof-tab-grid{grid-template-columns:repeat(4,1fr);}
          .prof-tab-btn{padding:10px 12px;}
        }
        @media(min-width:1024px){.prof-tabbar{display:none;}}

        /* ── Mobile meta panel ── */
        .prof-meta-panel{
          display:grid;grid-template-columns:repeat(3,1fr);
          background:#141414;border-radius:12px;margin-top:8px;overflow:hidden;
        }
        .prof-meta-cell{
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:14px 8px;text-align:center;position:relative;
        }
        .prof-meta-cell+.prof-meta-cell::before{
          content:'';position:absolute;left:0;top:18%;height:64%;
          width:1px;background:rgba(255,255,255,0.07);
        }
        .prof-meta-icon{margin-bottom:5px;}
        .prof-meta-lbl{font-size:9px;color:rgba(255,255,255,0.35);margin:0 0 3px;text-transform:uppercase;letter-spacing:0.06em;}
        .prof-meta-val{font-size:13px;font-weight:700;margin:0;white-space:nowrap;}

        /* ── Content ── */
        .prof-content{flex:1;min-width:0;display:flex;flex-direction:column;gap:14px;}

        /* ── Plan grid ── */
        .plan-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
        @media(min-width:768px){.plan-grid{grid-template-columns:repeat(4,1fr);gap:12px;}}

        /* ── Plan banner ── */
        .plan-banner{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
        @media(max-width:420px){
          .plan-banner{flex-direction:column;align-items:flex-start;}
          .plan-banner-upgrade{width:100%;text-align:center;}
        }

        /* ── Poster card hover ── */

        /* ── Poster grids ── */
        .prof-grid-4{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
        .prof-grid-5{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;}
        @media(min-width:480px){
          .prof-grid-4{grid-template-columns:repeat(3,1fr);}
          .prof-grid-5{grid-template-columns:repeat(3,1fr);}
        }
        @media(min-width:768px){
          .prof-grid-4{grid-template-columns:repeat(4,1fr);gap:12px;}
          .prof-grid-5{grid-template-columns:repeat(4,1fr);gap:12px;}
        }
        @media(min-width:1024px){.prof-grid-5{grid-template-columns:repeat(5,1fr);}}

        /* ── Settings inputs ── */
        .prof-input{
          width:100%;background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.1);
          border-radius:12px;padding:10px 16px;font-size:14px;color:#fff;
          outline:none;box-sizing:border-box;transition:border-color 0.15s;
        }
        .prof-input:focus{border-color:rgba(220,38,38,0.6);}

        /* ── Settings max-width: full on mobile, capped on desktop ── */
        .prof-settings-wrap{display:flex;flex-direction:column;gap:14px;width:100%;}
        @media(min-width:640px){.prof-settings-wrap{max-width:520px;}}
      `}</style>

      {/* ══ HERO ══ */}
      <div className="prof-outer">
        <div className="prof-hero">
          {/* Blur blobs */}
          <div style={{ position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none" }}>
            <div style={{ position:"absolute",width:600,height:350,top:-80,right:-60,background:"radial-gradient(ellipse,rgba(160,20,50,0.45) 0%,transparent 65%)",filter:"blur(55px)",borderRadius:"50%" }} />
            <div style={{ position:"absolute",width:400,height:400,top:-100,right:200,background:"radial-gradient(ellipse,rgba(90,15,140,0.35) 0%,transparent 60%)",filter:"blur(65px)",borderRadius:"50%" }} />
            <div style={{ position:"absolute",width:300,height:200,bottom:0,left:"30%",background:"radial-gradient(ellipse,rgba(120,10,60,0.25) 0%,transparent 65%)",filter:"blur(40px)",borderRadius:"50%" }} />
          </div>

          <div className="prof-hero-inner">
            <div className="prof-hero-row">

              {/* Avatar */}
              <div className="prof-avatar-wrap" style={{ position:"relative" }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" referrerPolicy="no-referrer"
                    style={{ width:84,height:84,borderRadius:14,objectFit:"cover",border:"2.5px solid rgba(255,255,255,0.18)",boxShadow:"0 8px 28px rgba(0,0,0,0.6)",display:"block" }} />
                ) : (
                  <div style={{ width:84,height:84,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,fontWeight:700,color:"#fff",background:"linear-gradient(135deg,#7b2ff7 0%,#c0392b 100%)",border:"2.5px solid rgba(255,255,255,0.18)",boxShadow:"0 8px 28px rgba(0,0,0,0.6)" }}>
                    {userInitial}
                  </div>
                )}
                <div style={{ position:"absolute",bottom:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#22c55e",border:"2px solid #1a0820" }} />
                <button onClick={() => fileInputRef.current?.click()}
                  style={{ position:"absolute",top:-7,right:-7,width:26,height:26,borderRadius:"50%",background:"#333",border:"2px solid #0a0a0a",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#fff" }}>
                  <FaCamera size={9} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display:"none" }} />
              </div>

              {/* Info */}
              <div className="prof-hero-info">
                <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:6 }}>
                  {editingName ? (
                    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                      <input value={newName} onChange={(e) => setNewName(e.target.value)}
                        style={{ background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:8,padding:"3px 10px",fontSize:18,fontWeight:700,color:"#fff",outline:"none",maxWidth:160 }} />
                      <button onClick={saveProfile} disabled={saving} style={{ color:"#4ade80",background:"none",border:"none",cursor:"pointer" }}><FaCheck size={13} /></button>
                      <button onClick={() => setEditingName(false)} style={{ color:"#f87171",background:"none",border:"none",cursor:"pointer" }}><FaTimes size={13} /></button>
                    </div>
                  ) : (
                    <>
                      <h1 style={{ fontSize:20,fontWeight:800,letterSpacing:"-0.3px",margin:0,color:"#fff",lineHeight:1.2 }}>{displayName}</h1>
                      <span style={{ background:"#dc2626",color:"#fff",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:999,letterSpacing:"0.08em",textTransform:"uppercase" }}>Free</span>
                      <button onClick={() => setEditingName(true)} style={{ background:"none",border:"none",color:"rgba(255,255,255,0.3)",cursor:"pointer",padding:0 }}><FaEdit size={12} /></button>
                    </>
                  )}
                </div>
                <p style={{ color:"rgba(255,255,255,0.5)",fontSize:12,margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{user?.email}</p>
                <div style={{ display:"flex",alignItems:"center",gap:4,color:"rgba(255,255,255,0.35)",fontSize:11 }}>
                  <FaCalendarAlt size={9} /><span>Since {memberSince}</span>
                </div>
                {saveMessage && <p style={{ color:"#4ade80",fontSize:11,marginTop:5 }}>{saveMessage}</p>}
              </div>

              {/* Edit Profile button */}
              <button className="prof-edit-btn" onClick={() => setActiveTab("settings")}>
                <FaEdit size={12} /> Edit Profile
              </button>
            </div>

            {/* Stats bar */}
            <div className="prof-stats">
              {stats.map((stat, i) => (
                <div key={i} className="prof-stat-cell">
                  <div className="prof-stat-inner">
                    <p className="prof-stat-val">{stat.value}</p>
                    <p className="prof-stat-lbl">{stat.label}</p>
                  </div>
                  {i < stats.length - 1 && <div className="prof-stat-div" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="prof-body">
        <div className="prof-body-row">

          {/* Desktop sidebar */}
          <div className="prof-sidebar">
            <div className="prof-sidebar-card">
              <div style={{ padding:"12px 12px 8px" }}>
                {sidebarLinks.map((link) => (
                  <button key={link.key} className="prof-sidebar-btn" onClick={() => setActiveTab(link.key)}
                    style={{ background:activeTab===link.key?"rgba(220,38,38,0.12)":"transparent", color:activeTab===link.key?"#f87171":"rgba(255,255,255,0.5)" }}
                    onMouseEnter={e=>{ if(activeTab!==link.key)(e.currentTarget as HTMLButtonElement).style.color="#fff"; }}
                    onMouseLeave={e=>{ if(activeTab!==link.key)(e.currentTarget as HTMLButtonElement).style.color="rgba(255,255,255,0.5)"; }}>
                    <span style={{ color:activeTab===link.key?"#f87171":"rgba(255,255,255,0.3)",flexShrink:0 }}>{link.icon}</span>
                    {link.label}
                  </button>
                ))}
              </div>
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="prof-sidebar-meta-row">
                  <span style={{ color:"rgba(255,255,255,0.4)",fontSize:14,flexShrink:0 }}>Streak</span>
                  <span style={{ color:"#fb923c",fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap" }}>
                    <FaFire size={12} />{streak} {streak===1?"day":"days"}
                  </span>
                </div>
                <div className="prof-sidebar-meta-row">
                  <span style={{ color:"rgba(255,255,255,0.4)",fontSize:14,flexShrink:0 }}>Fav. Genre</span>
                  <span style={{ color:favoriteGenre==="—"?"rgba(255,255,255,0.5)":"#fff",fontSize:14,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:120,textAlign:"right" }}>{favoriteGenre}</span>
                </div>
                <div className="prof-sidebar-meta-row">
                  <span style={{ color:"rgba(255,255,255,0.4)",fontSize:14,flexShrink:0 }}>Plan</span>
                  <span style={{ color:"#f87171",fontSize:14,fontWeight:600 }}>Free</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile nav + meta (hidden on desktop) */}
          <div className="prof-tabbar">
            {/* 2×2 grid tab nav — no scroll */}
            <div className="prof-tab-grid" style={{ background:"#141414",borderRadius:12,padding:6 }}>
              {sidebarLinks.map((link) => (
                <button key={link.key} className="prof-tab-btn" onClick={() => setActiveTab(link.key)}
                  style={{
                    background: activeTab===link.key ? "rgba(220,38,38,0.15)" : "rgba(255,255,255,0.04)",
                    color: activeTab===link.key ? "#f87171" : "rgba(255,255,255,0.5)",
                    border: activeTab===link.key ? "1px solid rgba(220,38,38,0.3)" : "1px solid transparent",
                  }}>
                  <span style={{ color:activeTab===link.key?"#f87171":"rgba(255,255,255,0.4)" }}>{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>

            {/* Meta panel */}
            <div className="prof-meta-panel">
              <div className="prof-meta-cell">
                <div className="prof-meta-icon"><FaFire size={14} color="#fb923c" /></div>
                <p className="prof-meta-lbl">Streak</p>
                <p className="prof-meta-val" style={{ color:"#fb923c" }}>{streak} {streak===1?"day":"days"}</p>
              </div>
              <div className="prof-meta-cell">
                <div className="prof-meta-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <p className="prof-meta-lbl">Top Genre</p>
                <p className="prof-meta-val" style={{ color:favoriteGenre==="—"?"rgba(255,255,255,0.5)":"#fff", fontSize:favoriteGenre.length>8?11:13 }}>{favoriteGenre}</p>
              </div>
              <div className="prof-meta-cell">
                <div className="prof-meta-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                  </svg>
                </div>
                <p className="prof-meta-lbl">Plan</p>
                <p className="prof-meta-val" style={{ color:"#f87171" }}>Free</p>
              </div>
            </div>
          </div>

          {/* ══ CONTENT ══ */}
          <div className="prof-content">

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                {/* Subscription */}
                <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                  <h2 style={{ fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",gap:8,margin:"0 0 14px" }}>
                    <FaCrown style={{ color:"#eab308" }} size={13} /> Subscription
                  </h2>
                  <div className="plan-banner" style={{ borderRadius:12,padding:"14px 16px",marginBottom:20,background:"linear-gradient(135deg,#4a0808 0%,#2e0404 60%,#1c0303 100%)",border:"1px solid rgba(180,20,20,0.3)" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:14 }}>
                      <div style={{ width:40,height:40,borderRadius:10,background:"rgba(220,38,38,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <FaGift style={{ color:"#f87171" }} size={16} />
                      </div>
                      <div>
                        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
                          <span style={{ fontWeight:600,fontSize:13,color:"#fff" }}>Free Plan</span>
                          <span style={{ background:"#16a34a",color:"#fff",fontSize:10,fontWeight:600,padding:"2px 7px",borderRadius:999 }}>Active</span>
                        </div>
                        <p style={{ color:"rgba(255,255,255,0.4)",fontSize:11,margin:0 }}>
                          No renewal needed · Free forever
                        </p>
                      </div>
                    </div>
                    {/* Paid plans aren't available yet, so this is a label rather than a button */}
                    <span className="plan-banner-upgrade" style={{ background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.6)",padding:"9px 16px",borderRadius:10,fontSize:12,fontWeight:600,whiteSpace:"nowrap" }}>
                      Paid plans coming soon
                    </span>
                  </div>
                  <div className="plan-grid">
                    {plans.map((plan) => (
                      <div key={plan.name} style={{ position:"relative",borderRadius:12,padding:plan.current?"1.8rem 0.9rem 0.9rem":"0.9rem",background:plan.current?"rgba(220,38,38,0.07)":"#0f0f0f",border:plan.current?"1px solid rgba(220,38,38,0.4)":"1px solid rgba(255,255,255,0.05)" }}>
                        {plan.current && (
                          <div style={{ position:"absolute",top:-12,left:0,right:0,display:"flex",justifyContent:"center",zIndex:10 }}>
                            <span style={{ background:"#dc2626",color:"#fff",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:999,whiteSpace:"nowrap",boxShadow:"0 2px 8px rgba(0,0,0,0.4)" }}>Current</span>
                          </div>
                        )}
                        <p style={{ fontWeight:600,fontSize:13,color:"#fff",margin:"0 0 3px" }}>{plan.name}</p>
                        <p style={{ fontSize:16,fontWeight:700,color:"#f87171",margin:"0 0 10px" }}>
                          {plan.price}{plan.priceUnit&&<span style={{ fontSize:10,fontWeight:400,color:"rgba(255,255,255,0.3)" }}>{plan.priceUnit}</span>}
                        </p>
                        <ul style={{ listStyle:"none",padding:0,margin:"0 0 12px" }}>
                          {plan.features.map((f)=>(
                            <li key={f} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.4)",marginBottom:5 }}>
                              <FaCheck size={6} style={{ color:"rgba(255,255,255,0.25)",flexShrink:0 }} />{f}
                            </li>
                          ))}
                        </ul>
                        {!plan.current&&(
                          <p style={{ width:"100%",padding:"5px 0",margin:0,borderRadius:7,fontSize:11,fontWeight:500,textAlign:"center",color:"rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.04)",border:"1px dashed rgba(255,255,255,0.09)" }}>
                            Coming soon
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recently Watched */}
                <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                    <h2 style={{ fontSize:15,fontWeight:600,color:"#fff",margin:0 }}>Recently Watched</h2>
                    <button onClick={()=>setActiveTab("history")} style={{ fontSize:12,color:"rgba(255,255,255,0.35)",background:"none",border:"none",cursor:"pointer" }}>See all</button>
                  </div>
                  {history.length===0
                    ?<p style={{ color:"rgba(255,255,255,0.25)",fontSize:13,textAlign:"center",padding:"28px 0" }}>No watch history yet</p>
                    :history.slice(0,5).map((item,i)=><ProgressRow key={item.id} item={item} index={i} total={Math.min(history.length,5)} />)
                  }
                </div>

                {/* My List preview */}
                <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                    <h2 style={{ fontSize:15,fontWeight:600,color:"#fff",margin:0 }}>My List</h2>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <span style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{favorites.length} titles</span>
                      <button onClick={()=>setActiveTab("favorites")} style={{ fontSize:11,color:"rgba(255,255,255,0.35)",background:"none",border:"none",cursor:"pointer" }}>See all</button>
                    </div>
                  </div>
                  {favorites.length===0
                    ?<p style={{ color:"rgba(255,255,255,0.25)",fontSize:13,textAlign:"center",padding:"28px 0" }}>Nothing saved yet</p>
                    :<div className="prof-grid-4">{favorites.slice(0,8).map(renderPoster)}</div>
                  }
                </div>
              </>
            )}

            {/* MY LIST TAB */}
            {activeTab==="favorites"&&(
              <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                <h2 style={{ fontSize:15,fontWeight:600,color:"#fff",margin:"0 0 16px",display:"flex",alignItems:"center",gap:8 }}>
                  My List <span style={{ color:"rgba(255,255,255,0.3)",fontSize:13,fontWeight:400 }}>{favorites.length} titles</span>
                </h2>
                {favorites.length===0?(
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"56px 0",color:"rgba(255,255,255,0.25)" }}>
                    <FaBookmark size={30} style={{ marginBottom:12 }} />
                    <p style={{ fontWeight:500,marginBottom:14 }}>Nothing saved yet</p>
                    <Link href="/" style={{ background:"#dc2626",color:"#fff",padding:"8px 20px",borderRadius:12,fontSize:13,textDecoration:"none" }}>Browse Movies</Link>
                  </div>
                ):(
                  <div className="prof-grid-5">{favorites.map(renderPoster)}</div>
                )}
              </div>
            )}

            {/* WATCH HISTORY TAB */}
            {activeTab==="history"&&(
              <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                <h2 style={{ fontSize:15,fontWeight:600,color:"#fff",margin:"0 0 16px",display:"flex",alignItems:"center",gap:8 }}>
                  Watch History <span style={{ color:"rgba(255,255,255,0.3)",fontSize:13,fontWeight:400 }}>{history.length} titles</span>
                </h2>
                {history.length===0?(
                  <div style={{ display:"flex",flexDirection:"column",alignItems:"center",padding:"56px 0",color:"rgba(255,255,255,0.25)" }}>
                    <FaHistory size={30} style={{ marginBottom:12 }} />
                    <p style={{ fontWeight:500,marginBottom:14 }}>No watch history yet</p>
                    <Link href="/" style={{ background:"#dc2626",color:"#fff",padding:"8px 20px",borderRadius:12,fontSize:13,textDecoration:"none" }}>Browse Movies</Link>
                  </div>
                ):(
                  history.map((item,i)=><ProgressRow key={item.id} item={item} index={i} total={history.length} />)
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab==="settings"&&(
              <div className="prof-settings-wrap">

                <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                  <h3 style={{ fontWeight:600,fontSize:13,color:"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",gap:8,margin:"0 0 14px" }}>
                    <FaUser size={11} style={{ color:"rgba(255,255,255,0.4)" }} /> Edit Profile
                  </h3>
                  <div style={{ display:"flex",flexDirection:"column",gap:11 }}>
                    {[{label:"Display Name",value:newName,setter:setNewName},{label:"Username",value:newUsername,setter:setNewUsername}].map(({label,value,setter})=>(
                      <div key={label}>
                        <label style={{ fontSize:11,color:"rgba(255,255,255,0.4)",display:"block",marginBottom:4 }}>{label}</label>
                        <input type="text" value={value} onChange={(e)=>setter(e.target.value)} className="prof-input" />
                      </div>
                    ))}
                    {saveMessage&&<p style={{ fontSize:13,color:saveMessage.includes("Error")?"#f87171":"#4ade80" }}>{saveMessage}</p>}
                    <button onClick={saveProfile} disabled={saving} style={{ background:"#dc2626",color:"#fff",padding:"10px 20px",borderRadius:12,fontSize:13,fontWeight:600,border:"none",cursor:"pointer",alignSelf:"flex-start" }}>
                      {saving?"Saving...":"Save Changes"}
                    </button>
                  </div>
                </div>

                <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                  <h3 style={{ fontWeight:600,fontSize:13,color:"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",gap:8,margin:"0 0 12px" }}>
                    <FaLock size={11} style={{ color:"rgba(255,255,255,0.4)" }} /> Change Password
                  </h3>
                  {changingPassword?(
                    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                      <input type="password" placeholder="New password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="prof-input" />
                      <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} className="prof-input" />
                      {passwordMessage&&<p style={{ fontSize:13,color:passwordMessage.includes("updated")?"#4ade80":"#f87171" }}>{passwordMessage}</p>}
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={handleChangePassword} style={{ background:"#dc2626",color:"#fff",padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,border:"none",cursor:"pointer" }}>Update</button>
                        <button onClick={()=>setChangingPassword(false)} style={{ background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.6)",padding:"8px 16px",borderRadius:10,fontSize:13,border:"none",cursor:"pointer" }}>Cancel</button>
                      </div>
                    </div>
                  ):(
                    <button onClick={()=>setChangingPassword(true)} style={{ background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.6)",padding:"10px 16px",borderRadius:10,fontSize:13,border:"none",cursor:"pointer" }}>Change Password</button>
                  )}
                </div>

                <div style={{ background:"#141414",borderRadius:16,padding:18 }}>
                  <h3 style={{ fontWeight:600,fontSize:13,color:"rgba(255,255,255,0.8)",display:"flex",alignItems:"center",gap:8,margin:"0 0 6px" }}>
                    <FaSignOutAlt size={11} style={{ color:"rgba(255,255,255,0.4)" }} /> Sign Out
                  </h3>
                  <p style={{ color:"rgba(255,255,255,0.3)",fontSize:13,margin:"0 0 12px" }}>Sign out of your account on this device.</p>
                  <button onClick={handleLogout} style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.6)",padding:"10px 16px",borderRadius:10,fontSize:13,border:"none",cursor:"pointer" }}>
                    <FaSignOutAlt size={11} /> Sign Out
                  </button>
                </div>

                <div style={{ background:"#141414",borderRadius:16,padding:18,border:"1px solid rgba(220,38,38,0.18)" }}>
                  <h3 style={{ fontWeight:600,fontSize:13,color:"#f87171",display:"flex",alignItems:"center",gap:8,margin:"0 0 6px" }}>
                    <FaTrash size={11} /> Delete Account
                  </h3>
                  <p style={{ color:"rgba(255,255,255,0.3)",fontSize:13,margin:"0 0 12px" }}>Permanently delete your account. This cannot be undone.</p>
                  {deletingAccount?(
                    <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                      <p style={{ color:"#f87171",fontSize:13,margin:0 }}>Are you sure? This cannot be undone.</p>
                      <div style={{ display:"flex",gap:8 }}>
                        <button onClick={handleDeleteAccount} disabled={deleteInProgress} style={{ background:"#dc2626",color:"#fff",padding:"8px 16px",borderRadius:10,fontSize:13,fontWeight:600,border:"none",cursor:deleteInProgress?"default":"pointer",opacity:deleteInProgress?0.6:1 }}>{deleteInProgress?"Deleting…":"Yes, Delete"}</button>
                        <button onClick={()=>{ setDeletingAccount(false); setDeleteError(""); }} disabled={deleteInProgress} style={{ background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.6)",padding:"8px 16px",borderRadius:10,fontSize:13,border:"none",cursor:"pointer" }}>Cancel</button>
                      </div>
                      {deleteError && <p style={{ color:"#f87171",fontSize:12,margin:0 }}>{deleteError}</p>}
                    </div>
                  ):(
                    <button onClick={()=>setDeletingAccount(true)} style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(220,38,38,0.09)",border:"1px solid rgba(220,38,38,0.22)",color:"#f87171",padding:"10px 16px",borderRadius:10,fontSize:13,cursor:"pointer" }}>
                      <FaTrash size={11} /> Delete Account
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}