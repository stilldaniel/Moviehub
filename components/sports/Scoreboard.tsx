"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SPORTS, TABLES_ENABLED, type Game, type SportKey, type StandingGroup } from "@/lib/sports";

const DAYS = [
  { key: "yesterday", label: "Yesterday" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
] as const;
type DayKey = (typeof DAYS)[number]["key"];

// Big competitions first; everything else follows, busiest leagues first
const FEATURED_LEAGUES: Partial<Record<SportKey, number[]>> = {
  football: [2, 3, 848, 39, 140, 135, 78, 61, 1, 4, 6, 12, 399, 253, 307, 94, 88, 45, 48, 143, 137, 81, 66],
  basketball: [12, 120, 116, 117, 202],
  "american-football": [1, 2],
  baseball: [1, 2],
  hockey: [57, 59],
  rugby: [16, 27, 44, 51, 71, 80],
  volleyball: [97, 98, 113],
  handball: [131, 132, 145],
};
const LEAGUES_PER_PAGE = 20;

type LeagueGroup = { key: string; league: Game["league"]; games: Game[]; live: number };

const timeFormat = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function StatusCell({ game }: { game: Game }) {
  if (game.state === "live") {
    return (
      <span className="flex items-center gap-1.5 text-red-400 font-semibold">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-75 animate-ping motion-reduce:animate-none" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-red-500" />
        </span>
        {game.status}
      </span>
    );
  }
  if (game.state === "scheduled") return <span className="text-gray-300">{timeFormat(game.start)}</span>;
  if (game.state === "cancelled") return <span className="text-gray-500">{game.status}</span>;
  return <span className="text-gray-500">{game.status === "Finished" ? "FT" : game.status}</span>;
}

function TeamLine({ side, showScore, dim }: { side: NonNullable<Game["home"]>; showScore: boolean; dim: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      {side.logo ? (
        <img src={side.logo} alt="" loading="lazy" className="w-5 h-5 object-contain shrink-0" />
      ) : (
        <span className="w-5 h-5 shrink-0 rounded-full bg-white/10" />
      )}
      <span className={`truncate text-sm ${dim ? "text-gray-400" : "text-white"} ${side.winner ? "font-semibold" : ""}`}>{side.name}</span>
      {showScore && side.score != null && (
        <span className={`ml-auto pl-3 tabular-nums text-sm ${dim ? "text-gray-400" : "text-white font-semibold"}`}>{side.score}</span>
      )}
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  const started = game.state === "live" || game.state === "finished";
  const loserDim = (side?: Game["home"], other?: Game["home"]) =>
    game.state === "finished" && side?.score != null && other?.score != null && side.score < other.score;

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-t border-white/5 first:border-t-0">
      <div className="w-16 shrink-0 text-xs">
        <StatusCell game={game} />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        {game.home && game.away ? (
          <>
            <TeamLine side={game.home} showScore={started} dim={loserDim(game.home, game.away)} />
            <TeamLine side={game.away} showScore={started} dim={loserDim(game.away, game.home)} />
            {game.subtitle && <p className="text-xs text-gray-500">{game.subtitle}</p>}
          </>
        ) : (
          <>
            <p className="text-sm text-white font-medium truncate">{game.title}</p>
            {game.subtitle && <p className="text-xs text-gray-500 truncate">{game.subtitle}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function StandingsTable({ sport, league }: { sport: SportKey; league: Game["league"] }) {
  const [groups, setGroups] = useState<StandingGroup[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sports/standings?sport=${sport}&league=${league.id}&season=${league.season}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setGroups(data.groups);
      })
      .catch((err: Error) => setError(err.message || "Couldn't load this table."));
  }, [sport, league.id, league.season]);

  if (error) return <p className="px-4 py-4 text-sm text-gray-400 border-t border-white/5">{error}</p>;
  if (!groups) return <div className="h-24 border-t border-white/5 animate-pulse bg-white/[0.02]" />;
  if (groups.length === 0) return <p className="px-4 py-4 text-sm text-gray-400 border-t border-white/5">No table is available for this competition.</p>;

  const hasDraws = groups.some((g) => g.rows.some((r) => r.drawn != null && r.drawn > 0));
  const hasPoints = groups.some((g) => g.rows.some((r) => r.points != null));

  return (
    <div className="border-t border-white/5 overflow-x-auto">
      {groups.map((group, gi) => (
        <table key={gi} className="w-full text-sm">
          {group.name && groups.length > 1 && (
            <caption className="text-left px-4 pt-3 pb-1 text-xs uppercase tracking-wider text-gray-500">{group.name}</caption>
          )}
          <thead>
            <tr className="text-xs text-gray-500">
              <th className="text-left font-normal px-4 py-2 w-8">#</th>
              <th className="text-left font-normal py-2">Team</th>
              <th className="font-normal px-2 py-2 w-9">P</th>
              <th className="font-normal px-2 py-2 w-9">W</th>
              {hasDraws && <th className="font-normal px-2 py-2 w-9">D</th>}
              <th className="font-normal px-2 py-2 w-9">L</th>
              {hasPoints && <th className="font-normal px-4 py-2 w-12">Pts</th>}
            </tr>
          </thead>
          <tbody>
            {group.rows.map((row) => (
              <tr key={`${row.rank}-${row.team}`} className="border-t border-white/5 text-center tabular-nums">
                <td className="text-left px-4 py-2 text-gray-500">{row.rank}</td>
                <td className="text-left py-2">
                  <span className="flex items-center gap-2 min-w-0">
                    {row.logo && <img src={row.logo} alt="" loading="lazy" className="w-4 h-4 object-contain shrink-0" />}
                    <span className="truncate">{row.team}</span>
                  </span>
                </td>
                <td className="px-2 py-2 text-gray-400">{row.played ?? "–"}</td>
                <td className="px-2 py-2 text-gray-400">{row.won ?? "–"}</td>
                {hasDraws && <td className="px-2 py-2 text-gray-400">{row.drawn ?? "–"}</td>}
                <td className="px-2 py-2 text-gray-400">{row.lost ?? "–"}</td>
                {hasPoints && <td className="px-4 py-2 font-semibold">{row.points ?? "–"}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}

function LeagueCard({ sport, group }: { sport: SportKey; group: LeagueGroup }) {
  const [showTable, setShowTable] = useState(false);
  const canShowTable = TABLES_ENABLED && SPORTS.find((s) => s.key === sport)?.standings && group.league.season != null;

  return (
    <section className="rounded-xl bg-[#111] ring-1 ring-white/5 overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 bg-white/[0.03]">
        {group.league.logo ? (
          <img src={group.league.logo} alt="" loading="lazy" className="w-6 h-6 object-contain shrink-0" />
        ) : (
          <span className="w-6 h-6 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate">{group.league.name}</h3>
          {group.league.country && <p className="text-xs text-gray-500 truncate">{group.league.country}</p>}
        </div>
        {group.live > 0 && <span className="text-xs text-red-400 font-medium">{group.live} live</span>}
        {canShowTable && (
          <button
            onClick={() => setShowTable((v) => !v)}
            aria-expanded={showTable}
            className="text-xs px-2.5 py-1 rounded-md bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            {showTable ? "Hide table" : "Table"}
          </button>
        )}
      </header>
      {showTable ? (
        <StandingsTable sport={sport} league={group.league} />
      ) : (
        group.games.map((game) => <GameRow key={game.id} game={game} />)
      )}
    </section>
  );
}

export default function Scoreboard({
  sport,
  day,
  onChange,
}: {
  sport: SportKey;
  day: DayKey;
  onChange: (next: { sport?: SportKey; day?: DayKey }) => void;
}) {
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState("");
  const [liveOnly, setLiveOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(LEAGUES_PER_PAGE);
  const [loadedKey, setLoadedKey] = useState("");

  const requestKey = `${sport}:${day}`;
  // Reset per-view state when the sport or day changes (done during render, not in an effect)
  if (loadedKey !== requestKey) {
    setLoadedKey(requestKey);
    setGames(null);
    setError("");
    setVisible(LEAGUES_PER_PAGE);
  }

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch(`/api/sports/games?sport=${sport}&day=${day}`)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          if (!cancelled) { setGames(data.games); setError(""); }
        })
        .catch((err: Error) => { if (!cancelled) setError(err.message || "Couldn't load scores right now."); });
    load();
    // Today's data can change; check again every 5 minutes while the page is open
    const timer = day === "today" ? setInterval(load, 5 * 60 * 1000) : undefined;
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [sport, day]);

  const groups = useMemo(() => {
    if (!games) return [];
    const q = query.trim().toLowerCase();
    const byLeague = new Map<string, LeagueGroup>();
    for (const game of games) {
      if (liveOnly && game.state !== "live") continue;
      if (q) {
        const haystack = [game.league.name, game.league.country, game.home?.name, game.away?.name, game.title].join(" ").toLowerCase();
        if (!haystack.includes(q)) continue;
      }
      const key = `${game.league.id}-${game.league.name}`;
      const group = byLeague.get(key) ?? { key, league: game.league, games: [], live: 0 };
      group.games.push(game);
      if (game.state === "live") group.live++;
      byLeague.set(key, group);
    }
    const featured = FEATURED_LEAGUES[sport] ?? [];
    const rank = (g: LeagueGroup) => {
      const i = featured.indexOf(g.league.id);
      return i === -1 ? featured.length : i;
    };
    return [...byLeague.values()].sort(
      (a, b) => rank(a) - rank(b) || b.live - a.live || b.games.length - a.games.length || a.league.name.localeCompare(b.league.name)
    );
  }, [games, liveOnly, query, sport]);

  const liveCount = games?.filter((g) => g.state === "live").length ?? 0;

  return (
    <div>
      {/* Sport chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {SPORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange({ sport: s.key })}
            aria-pressed={sport === s.key}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition duration-300 ease-soft cursor-pointer ${
              sport === s.key ? "bg-red-600 text-white" : "bg-[#141414] text-gray-400 ring-1 ring-white/5 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Day, live filter, search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-5 mb-5">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-[#141414] p-1 ring-1 ring-white/5">
            {DAYS.map((d) => (
              <button
                key={d.key}
                onClick={() => onChange({ day: d.key })}
                aria-pressed={day === d.key}
                className={`px-3.5 py-1.5 rounded-full text-sm transition cursor-pointer ${day === d.key ? "bg-white text-black font-semibold" : "text-gray-400 hover:text-white"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setLiveOnly((v) => !v)}
            aria-pressed={liveOnly}
            className={`px-3.5 py-2 rounded-full text-sm transition cursor-pointer ring-1 ${
              liveOnly ? "bg-red-600/15 text-red-300 ring-red-500/40" : "bg-[#141414] text-gray-400 ring-white/5 hover:text-white"
            }`}
          >
            Live{liveCount > 0 ? ` (${liveCount})` : ""}
          </button>
        </div>
        <label className="flex items-center gap-2 bg-[#141414] ring-1 ring-white/5 rounded-full px-3.5 focus-within:ring-white/20 transition sm:w-72">
          <Search size={15} className="text-gray-500 shrink-0" />
          <span className="sr-only">Search leagues or teams</span>
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setVisible(LEAGUES_PER_PAGE); }}
            placeholder="Search leagues or teams…"
            className="w-full bg-transparent py-2 text-sm text-white placeholder-gray-500 outline-none"
          />
        </label>
      </div>

      {error && !games ? (
        <p className="py-16 text-center text-sm text-gray-400">{error}</p>
      ) : !games ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-[#111] animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">
          {query ? `Nothing matches “${query}”.` : liveOnly ? "Nothing is live right now." : "No games scheduled for this day."}
        </p>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-2 items-start">
            {groups.slice(0, visible).map((group) => (
              <LeagueCard key={`${requestKey}-${group.key}`} sport={sport} group={group} />
            ))}
          </div>
          {groups.length > visible && (
            <div className="text-center mt-6">
              <button
                onClick={() => setVisible((v) => v + LEAGUES_PER_PAGE)}
                className="px-5 py-2 rounded-full bg-[#141414] ring-1 ring-white/10 text-sm text-gray-300 hover:text-white transition cursor-pointer"
              >
                Show more leagues ({groups.length - visible} more)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export type { DayKey };
