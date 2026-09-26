"use client";

import { useEffect, useMemo, useState } from "react";

const logoBaseUrl = "https://image.tmdb.org/t/p/w92";
const REGION_KEY = "moviehub_watch_region";
// TMDB lists services most-popular first; show the top few and link to the rest
const MAX_PER_GROUP = 8;

type Provider = { provider_id: number; provider_name: string; logo_path: string };
type RegionOffers = {
  link: string;
  flatrate?: Provider[];
  free?: Provider[];
  ads?: Provider[];
  rent?: Provider[];
  buy?: Provider[];
};

// Two-letter country from the browser locale, e.g. "en-NG" → "NG"
function browserRegion(): string {
  try {
    const saved = localStorage.getItem(REGION_KEY);
    if (saved) return saved;
  } catch { /* storage can be unavailable */ }
  const locale = typeof navigator !== "undefined" ? navigator.language : "";
  return locale.split("-")[1]?.toUpperCase() || "US";
}

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;
const regionName = (code: string) => regionNames?.of(code) ?? code;

// Streaming, rental and purchase options for a title, from TMDB's JustWatch data
export default function WhereToWatch({ mediaType, id }: { mediaType: "movie" | "tv"; id: number }) {
  const [results, setResults] = useState<Record<string, RegionOffers> | null>(null);
  const [failed, setFailed] = useState(false);
  // The region only affects markup after the client-side fetch, so reading the browser here can't cause a hydration mismatch
  const [region, setRegion] = useState(() => (typeof window === "undefined" ? "US" : browserRegion()));

  useEffect(() => {
    fetch(`/api/tmdb/${mediaType}/${id}/watch/providers`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setResults(data.results ?? {}))
      .catch(() => setFailed(true));
  }, [mediaType, id]);

  const regions = useMemo(
    () => Object.keys(results ?? {}).sort((a, b) => regionName(a).localeCompare(regionName(b))),
    [results]
  );

  const chooseRegion = (code: string) => {
    setRegion(code);
    try { localStorage.setItem(REGION_KEY, code); } catch { /* ignore */ }
  };

  if (failed) return null;

  const offers = results?.[region];
  // Merge the free/with-ads tiers into streaming, and drop duplicate services within each group
  const groups = offers
    ? ([
        ["Stream", [...(offers.flatrate ?? []), ...(offers.free ?? []), ...(offers.ads ?? [])]],
        ["Rent", offers.rent ?? []],
        ["Buy", offers.buy ?? []],
      ] as const)
        .map(([label, list]) => [label, list.filter((p, i, all) => all.findIndex((q) => q.provider_id === p.provider_id) === i)] as const)
        .filter(([, list]) => list.length > 0)
    : [];

  return (
    <section id="where-to-watch" className="mt-6 scroll-mt-24 max-w-2xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-gray-400 text-xs uppercase tracking-wider">Where to Watch</h2>
        {regions.length > 0 && (
          <label className="flex items-center gap-2 text-xs text-gray-500">
            <span className="sr-only">Country</span>
            <select
              value={region}
              onChange={(e) => chooseRegion(e.target.value)}
              className="bg-[#141414] border border-gray-800 rounded-md px-2 py-1 text-gray-300 outline-none focus:border-gray-600 cursor-pointer"
            >
              {!regions.includes(region) && <option value={region}>{regionName(region)}</option>}
              {regions.map((code) => (
                <option key={code} value={code}>{regionName(code)}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {results === null ? (
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-11 h-11 rounded-lg bg-[#161616] animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="text-sm text-gray-500">
          {regions.length === 0
            ? "No streaming, rental or purchase options are listed for this title yet."
            : `Not listed for ${regionName(region)}. Pick another country to see where it's available.`}
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map(([label, list]) => (
            <div key={label} className="flex items-start gap-3">
              <span className="w-12 shrink-0 pt-3 text-xs text-gray-500">{label}</span>
              <div className="flex flex-wrap gap-2">
                {list.slice(0, MAX_PER_GROUP).map((p) => (
                  <a
                    key={p.provider_id}
                    href={offers!.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${label} on ${p.provider_name}`}
                    className="block w-11 h-11 rounded-lg overflow-hidden ring-1 ring-white/10 transition duration-300 ease-soft hover:-translate-y-0.5 hover:ring-white/40"
                  >
                    <img src={`${logoBaseUrl}${p.logo_path}`} alt={p.provider_name} loading="lazy" className="w-full h-full object-cover" />
                  </a>
                ))}
                {list.length > MAX_PER_GROUP && (
                  <a
                    href={offers!.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#161616] ring-1 ring-white/10 text-xs font-semibold text-gray-400 transition duration-300 ease-soft hover:text-white hover:ring-white/40"
                    title={`See all ${list.length} ${label.toLowerCase()} options`}
                  >
                    +{list.length - MAX_PER_GROUP}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* JustWatch attribution is required when using TMDB's watch provider data */}
      <p className="mt-3 text-[11px] text-gray-600">
        Availability from{" "}
        <a href="https://www.justwatch.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">
          JustWatch
        </a>
      </p>
    </section>
  );
}
