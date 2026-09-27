"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LiveStreams from "@/components/sports/LiveStreams";
import Container from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/Headings";
import Spinner from "@/components/ui/Spinner";
import Scoreboard, { type DayKey } from "@/components/sports/Scoreboard";
import { isSportKey, type SportKey } from "@/lib/sports";

// useSearchParams needs a Suspense boundary so the page can still be prerendered
export default function SportsPage() {
  return (
    <Suspense fallback={<Spinner className="min-h-screen" />}>
      <SportsPageContent />
    </Suspense>
  );
}

function SportsPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  // Sport and day live in the URL (/sports?sport=basketball&day=tomorrow) so views can be shared
  const sportParam = params.get("sport") ?? "";
  const sport: SportKey = isSportKey(sportParam) ? sportParam : "football";
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
    <Container className="min-h-screen pt-28 pb-16">
      <PageHeader title="Sports" description="Live scores, fixtures and tables across football, basketball, tennis, F1 and more." />

      <LiveStreams />

      <Scoreboard sport={sport} day={day} onChange={change} />

      <p className="mt-10 text-[11px] text-fg-subtle">Scores and fixtures from ESPN. Times are shown in your local time zone.</p>
    </Container>
  );
}
