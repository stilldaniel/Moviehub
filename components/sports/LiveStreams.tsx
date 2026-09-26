"use client";

import { useEffect, useState } from "react";
import { FaPlay, FaTimes, FaYoutube } from "react-icons/fa";
import type { LiveStream } from "@/lib/officialChannels";

// Two-letter country from the browser locale, used to hide region-blocked streams
function viewerRegion(): string | undefined {
  return typeof navigator !== "undefined" ? navigator.language.split("-")[1]?.toUpperCase() : undefined;
}

function playableIn(stream: LiveStream, region?: string) {
  if (!region) return true;
  if (stream.blockedIn?.includes(region)) return false;
  if (stream.allowedIn && !stream.allowedIn.includes(region)) return false;
  return true;
}

function startsIn(iso?: string) {
  if (!iso) return "Soon";
  const mins = Math.round((Date.parse(iso) - Date.now()) / 60000);
  if (mins <= 1) return "Starting now";
  if (mins < 60) return `In ${mins} min`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Live and upcoming streams from official league/federation YouTube channels
export default function LiveStreams() {
  const [streams, setStreams] = useState<LiveStream[] | null>(null);
  const [playing, setPlaying] = useState<LiveStream | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/sports/youtube")
        .then((res) => (res.ok ? res.json() : { streams: [] }))
        .then((data) => {
          const region = viewerRegion();
          setStreams((data.streams as LiveStream[]).filter((s) => playableIn(s, region)));
        })
        .catch(() => setStreams([]));
    load();
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPlaying(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [playing]);

  // Nothing official is live or starting soon: hide the section entirely
  if (!streams || streams.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FaYoutube className="text-red-500" size={20} /> Live on YouTube
          </h2>
          <p className="text-sm text-gray-400">Free streams from official league and federation channels</p>
        </div>
      </div>

      <div className="poster-row">
        {streams.map((s, i) => (
          <button
            key={s.videoId}
            onClick={() => setPlaying(s)}
            className="poster-card text-left w-72 sm:w-80 cursor-pointer"
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="poster-frame" style={{ aspectRatio: "16 / 9" }}>
              {s.thumbnail && <img src={s.thumbnail} alt="" loading="lazy" className="poster-img" data-loaded="true" />}
              <div className={`poster-badge left-2 ${s.state === "live" ? "text-white bg-red-600!" : "text-gray-200"}`}>
                {s.state === "live" ? "● LIVE" : startsIn(s.scheduledStart)}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-12 h-12 rounded-full bg-black/60 backdrop-blur flex items-center justify-center ring-1 ring-white/20">
                  <FaPlay size={14} className="ml-0.5" />
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm font-medium line-clamp-2">{s.title}</p>
            <p className="text-xs text-gray-500">{s.channel} · {s.sport}</p>
          </button>
        ))}
      </div>

      {playing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={playing.title}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPlaying(null)}
        >
          <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{playing.title}</p>
                <p className="text-xs text-gray-400">{playing.channel} · official stream on YouTube</p>
              </div>
              <button onClick={() => setPlaying(null)} aria-label="Close player" className="shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer">
                <FaTimes size={14} />
              </button>
            </div>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.videoId}?autoplay=1&rel=0`}
                title={playing.title}
                className="w-full h-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
