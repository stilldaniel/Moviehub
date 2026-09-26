"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase, getSafeSession } from "@/lib/supabase";
import Link from "next/link";
import { cn, mediaHref } from "@/lib/utils";
import {
  FaEdit, FaHistory, FaTrash, FaCamera,
  FaLock, FaSignOutAlt, FaCheck, FaTimes,
  FaThLarge, FaBookmark, FaCog, FaCalendarAlt,
  FaGift, FaCrown, FaUser, FaFire, FaFilm,
} from "react-icons/fa";
import { MdOutlineWatchLater } from "react-icons/md";
import MovieCard from "@/components/MovieCard";
import { fetchRuntime } from "@/lib/tmdb";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Container from "@/components/ui/Container";
import EmptyState from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/Headings";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

const baseImageUrl = "https://image.tmdb.org/t/p/w154"; // history thumbnails are 52px wide

const formatRuntime = (mins?: number | null) => {
  if (!mins) return "";
  const h = Math.floor(mins / 60); const m = mins % 60;
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
};

const timeAgo = (dateStr: string) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  return `${Math.floor(days / 7)} weeks ago`;
};

// One watch-history entry. Defined at module level so it isn't recreated on every render.
function HistoryRow({ item }: { item: any }) {
  const progress: number | null = typeof item.progress === "number" && item.progress < 100 ? item.progress : null;
  const runtime = formatRuntime(item.runtime);
  return (
    <li>
      <Link href={mediaHref(item.media_type, item.media_id, item.title)} className="group flex items-center gap-3 py-3.5">
        <div className="h-[68px] w-[52px] shrink-0 overflow-hidden rounded-lg bg-surface-raised">
          {item.poster_path ? (
            <img src={`${baseImageUrl}${item.poster_path}`} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-fg-subtle"><FaFilm size={16} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-fg-soft">
            {item.media_type === "tv" ? "TV show" : "Movie"}
          </span>
          <p className="mt-1 truncate text-sm font-semibold transition group-hover:text-fg-soft">{item.title}</p>
          <p className="text-xs text-fg-subtle">
            {timeAgo(item.watched_at ?? item.created_at)}{runtime && ` · ${runtime}`}
          </p>
          {progress !== null && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} />
              </div>
              <span className="w-8 text-right text-[11px] text-fg-subtle">{progress}%</span>
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

export default function ProfilePage() {
  const router = useRouter();
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
      if (!session?.user) { router.replace("/auth/login"); return; }
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
    e.target.value = ""; // allow choosing the same file again after an error
    if (!file || !user) return;
    const showError = (message: string) => { setSaveMessage(message); setTimeout(() => setSaveMessage(""), 5000); };
    if (!file.type.startsWith("image/")) return showError("Choose an image file");
    if (file.size > 2 * 1024 * 1024) return showError("Image must be 2 MB or smaller");
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true, contentType: file.type });
    if (uploadError) return showError(`Upload failed: ${uploadError.message}`);
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    // Same file name on every upload, so add a version to stop browsers showing the old picture
    const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`;
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

  const handleLogout = async () => { await supabase.auth.signOut(); router.replace("/auth/login"); router.refresh(); };
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
    router.replace("/auth/signup");
    router.refresh();
  };

  const removeFavorite = (item: any) =>
    setFavorites((prev) => prev.filter((f) => !(f.media_id === item.media_id && f.media_type === item.media_type)));

  if (loading) return <Spinner className="min-h-screen" />;

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

  const tabButton = (key: string, compact = false) => {
    const active = activeTab === key;
    return cn(
      "flex items-center gap-3 rounded-xl text-sm font-medium transition cursor-pointer",
      compact ? "justify-center px-2 py-2.5 text-xs" : "w-full px-4 py-3",
      active ? "bg-brand/12 text-danger ring-1 ring-inset ring-brand/30" : "text-fg-muted hover:text-fg hover:bg-white/5"
    );
  };

  const statusMessage = (message: string) =>
    message && <p className={cn("text-xs", message.endsWith("!") ? "text-success" : "text-danger")}>{message}</p>;

  return (
    <div className="min-h-screen bg-canvas">
      {/* ══ HERO ══ */}
      <Container className="pt-24 lg:pt-28">
        <section className="relative overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
          {/* Brand glow instead of the old purple blobs */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-16 h-80 w-[36rem] rounded-full bg-brand/25 blur-[70px]" />
            <div className="absolute -bottom-20 left-1/4 h-56 w-80 rounded-full bg-brand/10 blur-[60px]" />
          </div>

          <div className="relative px-5 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pt-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-7">
              <div className="flex items-start gap-4 md:gap-7 flex-1 min-w-0">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-20 w-20 md:h-24 md:w-24 rounded-2xl object-cover ring-2 ring-white/15 shadow-xl shadow-black/60"
                    />
                  ) : (
                    <div className="flex h-20 w-20 md:h-24 md:w-24 items-center justify-center rounded-2xl bg-linear-to-br from-brand to-brand-deep text-3xl font-bold ring-2 ring-white/15 shadow-xl shadow-black/60">
                      {userInitial}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change profile picture"
                    className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-control text-fg ring-2 ring-canvas transition hover:bg-control-hover cursor-pointer"
                  >
                    <FaCamera size={11} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>

                {/* Name, email, member since */}
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <Input
                          aria-label="Display name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="h-9 max-w-[12rem] text-base font-semibold"
                        />
                        <button onClick={saveProfile} disabled={saving} aria-label="Save name" className="p-1.5 text-success cursor-pointer">
                          <FaCheck size={14} />
                        </button>
                        <button onClick={() => setEditingName(false)} aria-label="Cancel" className="p-1.5 text-danger cursor-pointer">
                          <FaTimes size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <h1 className="truncate text-2xl md:text-3xl font-bold tracking-tight">{displayName}</h1>
                        <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Free</span>
                        <button onClick={() => setEditingName(true)} aria-label="Edit name" className="p-1 text-fg-subtle transition hover:text-fg cursor-pointer">
                          <FaEdit size={13} />
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-fg-muted">{user?.email}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
                    <FaCalendarAlt size={10} /> Member since {memberSince}
                  </p>
                  <div className="mt-1.5">{statusMessage(saveMessage)}</div>
                </div>
              </div>

              <Button variant="secondary" className="w-full md:w-auto bg-white/8 ring-1 ring-inset ring-line-strong" icon={<FaEdit size={12} />} onClick={() => setActiveTab("settings")}>
                Edit profile
              </Button>
            </div>

            {/* Stats */}
            <dl className="mt-6 md:mt-8 grid grid-cols-4 divide-x divide-line border-t border-line py-5 md:py-6">
              {stats.map((stat) => (
                <div key={stat.label} className="px-1 text-center">
                  <dd className="text-lg sm:text-xl md:text-2xl font-extrabold leading-tight">{stat.value}</dd>
                  <dt className="mt-1 text-[11px] sm:text-xs text-fg-subtle">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </Container>

      {/* ══ BODY ══ */}
      <Container className="pt-5 pb-16 lg:pt-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-24">
            <Card className="p-3 sm:p-3">
              <nav aria-label="Profile sections" className="space-y-1">
                {sidebarLinks.map((link) => (
                  <button key={link.key} onClick={() => setActiveTab(link.key)} aria-current={activeTab === link.key ? "page" : undefined} className={tabButton(link.key)}>
                    <span className="shrink-0 opacity-80">{link.icon}</span>
                    {link.label}
                  </button>
                ))}
              </nav>
              <dl className="mt-3 border-t border-line pt-2 text-sm">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-fg-muted">Streak</dt>
                  <dd className="flex items-center gap-1.5 font-semibold text-warning"><FaFire size={12} />{streak} {streak === 1 ? "day" : "days"}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <dt className="shrink-0 text-fg-muted">Top genre</dt>
                  <dd className={cn("truncate font-semibold", favoriteGenre === "—" && "text-fg-subtle")}>{favoriteGenre}</dd>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-fg-muted">Plan</dt>
                  <dd className="font-semibold text-danger">Free</dd>
                </div>
              </dl>
            </Card>
          </aside>

          {/* Mobile tabs + quick stats */}
          <div className="lg:hidden space-y-2">
            <nav aria-label="Profile sections" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5 ring-1 ring-line sm:grid-cols-4">
              {sidebarLinks.map((link) => (
                <button key={link.key} onClick={() => setActiveTab(link.key)} aria-current={activeTab === link.key ? "page" : undefined} className={tabButton(link.key, true)}>
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </nav>
            <dl className="grid grid-cols-3 divide-x divide-line rounded-2xl bg-surface py-3 text-center ring-1 ring-line">
              <div className="px-2">
                <dt className="text-[10px] uppercase tracking-wider text-fg-subtle">Streak</dt>
                <dd className="mt-1 text-sm font-bold text-warning">{streak} {streak === 1 ? "day" : "days"}</dd>
              </div>
              <div className="px-2 min-w-0">
                <dt className="text-[10px] uppercase tracking-wider text-fg-subtle">Top genre</dt>
                <dd className={cn("mt-1 truncate text-sm font-bold", favoriteGenre === "—" && "text-fg-subtle")}>{favoriteGenre}</dd>
              </div>
              <div className="px-2">
                <dt className="text-[10px] uppercase tracking-wider text-fg-subtle">Plan</dt>
                <dd className="mt-1 text-sm font-bold text-danger">Free</dd>
              </div>
            </dl>
          </div>

          {/* ══ CONTENT ══ */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                <Card as="section">
                  <SectionHeader title={<span className="flex items-center gap-2 text-base"><FaCrown className="text-rating" size={14} /> Subscription</span>} className="mb-4" />
                  <div className="mb-5 flex flex-col gap-3 rounded-xl bg-linear-to-br from-brand/20 to-brand/5 p-4 ring-1 ring-brand/25 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-danger"><FaGift size={16} /></div>
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold">
                          Free plan <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Active</span>
                        </p>
                        <p className="mt-0.5 text-xs text-fg-muted">No renewal needed · Free forever</p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-white/8 px-3 py-2 text-center text-xs font-semibold text-fg-muted">Paid plans coming soon</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {plans.map((plan) => (
                      <div key={plan.name} className={cn("relative rounded-xl p-4 ring-1", plan.current ? "bg-brand/8 ring-brand/40 pt-6" : "bg-canvas/40 ring-line")}>
                        {plan.current && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold shadow-lg shadow-black/40">Current</span>
                        )}
                        <p className="text-sm font-semibold">{plan.name}</p>
                        <p className="mb-3 mt-0.5 text-lg font-bold text-danger">
                          {plan.price}
                          {plan.priceUnit && <span className="text-xs font-normal text-fg-subtle">{plan.priceUnit}</span>}
                        </p>
                        <ul className="space-y-1.5">
                          {plan.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-fg-muted">
                              <FaCheck size={8} className="shrink-0 text-fg-subtle" />{f}
                            </li>
                          ))}
                        </ul>
                        {!plan.current && (
                          <p className="mt-3 rounded-md border border-dashed border-line py-1.5 text-center text-xs text-fg-subtle">Coming soon</p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                <Card as="section">
                  <SectionHeader
                    title={<span className="text-base">Recently watched</span>}
                    action={<button onClick={() => setActiveTab("history")} className="text-fg-muted transition hover:text-fg cursor-pointer">See all</button>}
                    className="mb-1"
                  />
                  {history.length === 0 ? (
                    <EmptyState icon={<FaHistory size={20} />} title="No watch history yet" className="py-10" />
                  ) : (
                    <ul className="divide-y divide-line">
                      {history.slice(0, 5).map((item) => <HistoryRow key={item.id} item={item} />)}
                    </ul>
                  )}
                </Card>

                <Card as="section">
                  <SectionHeader
                    title={<span className="text-base">My List</span>}
                    action={
                      <span className="flex items-center gap-3">
                        <span className="text-fg-subtle">{favorites.length} titles</span>
                        <button onClick={() => setActiveTab("favorites")} className="text-fg-muted transition hover:text-fg cursor-pointer">See all</button>
                      </span>
                    }
                    className="mb-4"
                  />
                  {favorites.length === 0 ? (
                    <EmptyState icon={<FaBookmark size={20} />} title="Nothing saved yet" className="py-10" />
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{favorites.slice(0, 8).map(renderPoster)}</div>
                  )}
                </Card>
              </>
            )}

            {/* MY LIST */}
            {activeTab === "favorites" && (
              <Card as="section">
                <SectionHeader title={<span className="text-base">My List <span className="ml-1 text-sm font-normal text-fg-subtle">{favorites.length} titles</span></span>} className="mb-4" />
                {favorites.length === 0 ? (
                  <EmptyState icon={<FaBookmark size={20} />} title="Nothing saved yet" description="Tap + on any movie or show to save it." action={<Button href="/">Browse movies</Button>} />
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">{favorites.map(renderPoster)}</div>
                )}
              </Card>
            )}

            {/* WATCH HISTORY */}
            {activeTab === "history" && (
              <Card as="section">
                <SectionHeader title={<span className="text-base">Watch history <span className="ml-1 text-sm font-normal text-fg-subtle">{history.length} titles</span></span>} className="mb-1" />
                {history.length === 0 ? (
                  <EmptyState icon={<FaHistory size={20} />} title="No watch history yet" action={<Button href="/">Browse movies</Button>} />
                ) : (
                  <ul className="divide-y divide-line">
                    {history.map((item) => <HistoryRow key={item.id} item={item} />)}
                  </ul>
                )}
              </Card>
            )}

            {/* SETTINGS */}
            {activeTab === "settings" && (
              <div className="flex w-full flex-col gap-4 sm:max-w-xl">
                <Card as="section">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><FaUser size={11} className="text-fg-subtle" /> Edit profile</h2>
                  <div className="space-y-3">
                    <Input label="Display name" name="displayName" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <Input label="Username" name="username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                    {statusMessage(saveMessage)}
                    <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                  </div>
                </Card>

                <Card as="section">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><FaLock size={11} className="text-fg-subtle" /> Change password</h2>
                  {changingPassword ? (
                    <div className="space-y-3">
                      <Input type="password" autoComplete="new-password" placeholder="New password" aria-label="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                      <Input type="password" autoComplete="new-password" placeholder="Confirm password" aria-label="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      {passwordMessage && <p className={cn("text-xs", passwordMessage.includes("updated") ? "text-success" : "text-danger")}>{passwordMessage}</p>}
                      <div className="flex gap-2">
                        <Button onClick={handleChangePassword}>Update password</Button>
                        <Button variant="secondary" onClick={() => setChangingPassword(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="secondary" onClick={() => setChangingPassword(true)}>Change password</Button>
                  )}
                </Card>

                <Card as="section">
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><FaSignOutAlt size={11} className="text-fg-subtle" /> Sign out</h2>
                  <p className="mb-3 text-sm text-fg-muted">Sign out of your account on this device.</p>
                  <Button variant="secondary" icon={<FaSignOutAlt size={11} />} onClick={handleLogout}>Sign out</Button>
                </Card>

                <Card as="section" className="ring-brand/25">
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-danger"><FaTrash size={11} /> Delete account</h2>
                  <p className="mb-3 text-sm text-fg-muted">Permanently delete your account and everything in it. This can&apos;t be undone.</p>
                  {deletingAccount ? (
                    <div className="space-y-3">
                      <p className="text-sm text-danger">Are you sure? This can&apos;t be undone.</p>
                      <div className="flex gap-2">
                        <Button onClick={handleDeleteAccount} disabled={deleteInProgress}>{deleteInProgress ? "Deleting…" : "Yes, delete my account"}</Button>
                        <Button variant="secondary" disabled={deleteInProgress} onClick={() => { setDeletingAccount(false); setDeleteError(""); }}>Cancel</Button>
                      </div>
                      {deleteError && <p className="text-xs text-danger">{deleteError}</p>}
                    </div>
                  ) : (
                    <Button variant="danger" icon={<FaTrash size={11} />} onClick={() => setDeletingAccount(true)}>Delete account</Button>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
