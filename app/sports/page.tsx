"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LiveStreams from "@/components/sports/LiveStreams";
import Scoreboard, { type DayKey } from "@/components/sports/Scoreboard";
import { sportConfig, type SportKey } from "@/lib/sports";

// useSearchParams needs a Suspense boundary so the page can still be prerendered
export default function SportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SportsPageContent />
    </Suspense>
  );
}

function SportsPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Sport and day live in the URL (/sports?sport=basketball&day=tomorrow) so views can be shared
  const sport = (sportConfig(params.get("sport") ?? "")?.key ?? "football") as SportKey;
  const dayParam = params.get("day");
  const day: DayKey = dayParam === "yesterday" || dayParam === "tomorrow" ? dayParam : "today";

  const change = (next: { sport?: SportKey; day?: DayKey }) => {
    const q = new URLSearchParams();
    const s = next.sport ?? sport;
    const d = next.day ?? day;
    if (s !== "football") q.set("sport", s);
    if (d !== "today") q.set("day", d);
    router.replace(q.size ? `/sports?${q}` : "/sports", { scroll: false });
  };

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Sports</h1>
        <p className="text-gray-400 text-sm mt-1">Scores and fixtures across every league. Scores update about every 20 minutes.</p>
      </div>

      <LiveStreams />

      <Scoreboard sport={sport} day={day} onChange={change} />

      <p className="mt-10 text-[11px] text-gray-600">Scores and fixtures from API-Sports. Times are shown in your local time zone.</p>
    </div>
  );
}
