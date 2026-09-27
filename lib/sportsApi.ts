// Server-only: scores, fixtures and tables from ESPN's public site API.
// It needs no key but is unofficial and undocumented, so every call is cached and any failure
// turns into a friendly "unavailable" message instead of breaking the page.
import { unstable_cache } from "next/cache";
import { SportsApiError, type Game, type GameState, type Side, type SportKey, type StandingGroup } from "./sports";

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN responses are untyped */

type Kind = "team" | "tennis" | "golf" | "racing" | "fight";
type SportSource = { kind: Kind; leagues: string[]; otherSoccer?: boolean };

// ESPN league paths per sport, most important first. Order also sets display order.
const SOURCES: Record<SportKey, SportSource> = {
  football: {
    kind: "team",
    leagues: [
      "soccer/uefa.champions", "soccer/eng.1", "soccer/esp.1", "soccer/ita.1", "soccer/ger.1", "soccer/fra.1",
      "soccer/caf.nations", "soccer/nga.1", "soccer/caf.champions", "soccer/fifa.world", "soccer/fifa.worldq.caf",
      "soccer/uefa.europa", "soccer/uefa.europa.conf", "soccer/uefa.nations", "soccer/fifa.friendly",
      "soccer/eng.fa", "soccer/eng.league_cup", "soccer/esp.copa_del_rey", "soccer/ita.coppa_italia",
      "soccer/ger.dfb_pokal", "soccer/fra.coupe_de_france", "soccer/eng.2", "soccer/por.1", "soccer/ned.1",
      "soccer/sco.1", "soccer/tur.1", "soccer/bel.1", "soccer/usa.1", "soccer/mex.1", "soccer/bra.1",
      "soccer/arg.1", "soccer/conmebol.libertadores", "soccer/concacaf.champions", "soccer/rsa.1",
      "soccer/jpn.1", "soccer/aus.1", "soccer/uefa.wchampions", "soccer/eng.w.1", "soccer/usa.nwsl",
    ],
    // Everything else (other leagues, friendlies, college) is grouped under "Other competitions"
    otherSoccer: true,
  },
  basketball: { kind: "team", leagues: ["basketball/nba", "basketball/wnba", "basketball/mens-college-basketball", "basketball/womens-college-basketball"] },
  "american-football": { kind: "team", leagues: ["football/nfl", "football/college-football", "football/cfl", "football/ufl"] },
  baseball: { kind: "team", leagues: ["baseball/mlb", "baseball/college-baseball"] },
  hockey: { kind: "team", leagues: ["hockey/nhl", "hockey/mens-college-hockey"] },
  tennis: { kind: "tennis", leagues: ["tennis/atp", "tennis/wta"] },
  golf: { kind: "golf", leagues: ["golf/pga", "golf/lpga", "golf/eur", "golf/liv"] },
  motorsport: { kind: "racing", leagues: ["racing/f1", "racing/irl", "racing/nascar-premier"] },
  mma: { kind: "fight", leagues: ["mma/ufc", "mma/pfl"] },
  rugby: {
    kind: "team",
    leagues: ["rugby/164205", "rugby/180659", "rugby/244293", "rugby/267979", "rugby/270557", "rugby/270559", "rugby/242041"],
  },
};

// Competitions whose standings are worth a "Table" button (league formats, not knockouts)
const TABLE_LEAGUES = new Set([
  "soccer/eng.1", "soccer/esp.1", "soccer/ita.1", "soccer/ger.1", "soccer/fra.1", "soccer/nga.1", "soccer/eng.2",
  "soccer/por.1", "soccer/ned.1", "soccer/sco.1", "soccer/tur.1", "soccer/bel.1", "soccer/usa.1", "soccer/mex.1",
  "soccer/bra.1", "soccer/arg.1", "soccer/rsa.1", "soccer/jpn.1", "soccer/aus.1", "soccer/eng.w.1", "soccer/usa.nwsl",
  "soccer/uefa.champions", "soccer/uefa.europa", "soccer/uefa.europa.conf",
  "basketball/nba", "basketball/wnba", "football/nfl", "football/cfl", "baseball/mlb", "hockey/nhl",
  "rugby/180659", "rugby/244293", "rugby/267979", "rugby/270557", "rugby/270559", "rugby/242041",
]);

export const isTableLeague = (path: string) => TABLE_LEAGUES.has(path);

const UNAVAILABLE = "Scores are temporarily unavailable. Please check back later.";
const SITE = "https://site.api.espn.com/apis/site/v2/sports";

// Fetch + parse; throws on failure so the result is never cached (see cachedJson)
async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store", headers: { accept: "application/json" } });
  if (!res.ok) {
    console.error(`ESPN ${res.status} for ${url}`);
    throw new SportsApiError(UNAVAILABLE);
  }
  return res.json();
}

// Successful responses are cached for `revalidate` seconds; failures throw and are retried next time
const cachedJson = (url: string, revalidate: number) =>
  unstable_cache(() => fetchJson(url), ["espn", url], { revalidate })();

// ── Helpers ─────────────────────────────────────────────────────────────────

const toNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function stateOf(status: any): GameState {
  const type = status?.type ?? {};
  if (/POSTPONED|CANCELED|CANCELLED|ABANDONED|SUSPENDED|FORFEIT/.test(type.name ?? "")) return "cancelled";
  if (type.state === "in") return "live";
  if (type.state === "post" || type.completed) return "finished";
  return "scheduled";
}

function statusLabel(status: any, state: GameState, soccer: boolean): string {
  const type = status?.type ?? {};
  if (state === "live") return (soccer ? status?.displayClock : type.shortDetail) || type.shortDetail || "Live";
  if (state === "finished") return soccer ? "FT" : type.shortDetail === "Final" ? "Final" : type.shortDetail || "Final";
  if (state === "cancelled") return type.shortDetail || "Postponed";
  return "";
}

// Prefer the logo designed for dark backgrounds
function pickLogo(logos: any[] | undefined): string | undefined {
  if (!logos?.length) return undefined;
  return (logos.find((l) => l.rel?.includes("dark")) ?? logos[0])?.href;
}

const leagueMeta = (data: any, path: string, order: number) => {
  const l = data.leagues?.[0] ?? {};
  return {
    id: path,
    name: l.name ?? l.abbreviation ?? path,
    logo: pickLogo(l.logos),
    order,
    table: TABLE_LEAGUES.has(path) ? path : undefined,
  };
};

// Same UTC calendar date as the requested day (for multi-day events like tennis or UFC cards)
const onDay = (iso: string | undefined, date: string) => !!iso && new Date(iso).toISOString().slice(0, 10) === date;

const sideFromTeam = (c: any): Side => ({
  name: c.team?.displayName ?? c.team?.name ?? "TBD",
  logo: c.team?.logo ?? pickLogo(c.team?.logos),
  score: toNumber(c.score),
  winner: c.winner || undefined,
});

// Singles/fighters have an athlete; tennis doubles pairs have a roster of two
const sideFromAthlete = (c: any): Side => ({
  name: c.athlete?.displayName ?? c.roster?.shortDisplayName ?? c.roster?.displayName ?? c.team?.displayName ?? "TBD",
  logo: c.athlete?.flag?.href ?? c.roster?.athletes?.[0]?.flag?.href,
  winner: c.winner || undefined,
});

// ── Normalising each kind of sport ──────────────────────────────────────────

function teamGames(data: any, path: string, order: number): Game[] {
  const league = leagueMeta(data, path, order);
  const soccer = path.startsWith("soccer/");
  return (data.events ?? []).map((e: any): Game => {
    const comp = e.competitions?.[0] ?? {};
    const state = stateOf(comp.status ?? e.status);
    const home = comp.competitors?.find((c: any) => c.homeAway === "home") ?? comp.competitors?.[0];
    const away = comp.competitors?.find((c: any) => c.homeAway === "away") ?? comp.competitors?.[1];
    return {
      id: `${path}:${e.id}`,
      start: Date.parse(e.date),
      state,
      status: statusLabel(comp.status ?? e.status, state, soccer),
      league,
      home: home ? sideFromTeam(home) : undefined,
      away: away ? sideFromTeam(away) : undefined,
    };
  });
}

function tennisGames(data: any, path: string, order: number, date: string): Game[] {
  const base = leagueMeta(data, path, order);
  const games: Game[] = [];
  for (const e of data.events ?? []) {
    for (const group of e.groupings ?? []) {
      const league = { ...base, id: `${path}:${e.id}:${group.grouping?.slug}`, name: `${e.name} · ${group.grouping?.displayName ?? ""}`.trim(), table: undefined };
      for (const m of group.competitions ?? []) {
        if (!onDay(m.date ?? m.startDate, date)) continue;
        const state = stateOf(m.status);
        const [a, b] = m.competitors ?? [];
        if (!a || !b) continue;
        const setsWon = (c: any) => (c.linescores ?? []).filter((s: any) => s.winner).length;
        const sets = (a.linescores ?? []).map((s: any, i: number) => `${s.value ?? ""}-${b.linescores?.[i]?.value ?? ""}`).join("  ");
        games.push({
          id: `${path}:${m.id}`,
          start: Date.parse(m.date ?? m.startDate),
          state,
          status: statusLabel(m.status, state, false),
          league,
          home: { ...sideFromAthlete(a), score: state === "scheduled" ? null : setsWon(a) },
          away: { ...sideFromAthlete(b), score: state === "scheduled" ? null : setsWon(b) },
          subtitle: sets || undefined,
        });
      }
    }
  }
  return games;
}

function fightGames(data: any, path: string, order: number, date: string): Game[] {
  const base = leagueMeta(data, path, order);
  const games: Game[] = [];
  for (const e of data.events ?? []) {
    const league = { ...base, id: `${path}:${e.id}`, name: e.name, table: undefined };
    for (const f of e.competitions ?? []) {
      if (!onDay(f.date ?? e.date, date)) continue;
      const state = stateOf(f.status);
      const [a, b] = f.competitors ?? [];
      if (!a || !b) continue;
      games.push({
        id: `${path}:${f.id}`,
        start: Date.parse(f.date ?? e.date),
        state,
        status: statusLabel(f.status, state, false),
        league,
        home: sideFromAthlete(a),
        away: sideFromAthlete(b),
        subtitle: f.type?.abbreviation,
      });
    }
  }
  return games;
}

const SESSION_NAMES: Record<string, string> = { FP1: "Practice 1", FP2: "Practice 2", FP3: "Practice 3", Qual: "Qualifying", SS: "Sprint Shootout", Sprint: "Sprint", Race: "Race" };

function racingGames(data: any, path: string, order: number, date: string): Game[] {
  const league = leagueMeta(data, path, order);
  const games: Game[] = [];
  for (const e of data.events ?? []) {
    for (const s of e.competitions ?? []) {
      if (!onDay(s.date ?? e.date, date)) continue;
      const state = stateOf(s.status);
      const leader = [...(s.competitors ?? [])].sort((x: any, y: any) => (x.order ?? 99) - (y.order ?? 99))[0];
      const session = SESSION_NAMES[s.type?.abbreviation] ?? s.type?.abbreviation ?? "Race";
      const who = leader?.athlete?.displayName;
      games.push({
        id: `${path}:${s.id}`,
        start: Date.parse(s.date ?? e.date),
        state,
        status: statusLabel(s.status, state, false),
        league,
        title: `${e.shortName ?? e.name} · ${session}`,
        subtitle: who && state !== "scheduled" ? `${state === "live" ? "Leader" : "Winner"}: ${who}` : undefined,
      });
    }
  }
  return games;
}

function golfGames(data: any, path: string, order: number): Game[] {
  const league = leagueMeta(data, path, order);
  return (data.events ?? []).map((e: any): Game => {
    const comp = e.competitions?.[0] ?? {};
    const state = stateOf(comp.status ?? e.status);
    const competitors: any[] = comp.competitors ?? [];
    // Team events (Presidents Cup, Ryder Cup) are match play: the higher points total leads.
    // Stroke play lists players in leaderboard order.
    const isTeamEvent = competitors.some((c) => c.team && !c.athlete);
    const leader = isTeamEvent
      ? competitors.find((c) => c.winner) ?? [...competitors].sort((x, y) => (toNumber(y.score) ?? 0) - (toNumber(x.score) ?? 0))[0]
      : [...competitors].sort((x, y) => (x.order ?? 999) - (y.order ?? 999))[0];
    const leaderName = leader?.athlete?.displayName ?? leader?.team?.displayName;
    return {
      id: `${path}:${e.id}`,
      start: Date.parse(e.date),
      state,
      status: state === "finished" ? "Final" : statusLabel(comp.status ?? e.status, state, false),
      league,
      title: e.name,
      subtitle: leaderName && state !== "scheduled" ? `${state === "live" ? "Leader" : "Winner"}: ${leaderName}${leader?.score ? ` (${leader.score})` : ""}` : undefined,
    };
  });
}

// Matches from soccer/all that aren't in one of our named leagues, grouped by ESPN's match note
function otherSoccerGames(data: any, known: Set<string>, order: number): Game[] {
  return (data.events ?? [])
    .filter((e: any) => !known.has(e.id))
    .map((e: any): Game => {
      const comp = e.competitions?.[0] ?? {};
      const state = stateOf(comp.status ?? e.status);
      const note: string = comp.altGameNote || e.competitions?.[0]?.notes?.[0]?.headline || "Other competitions";
      const home = comp.competitors?.find((c: any) => c.homeAway === "home") ?? comp.competitors?.[0];
      const away = comp.competitors?.find((c: any) => c.homeAway === "away") ?? comp.competitors?.[1];
      return {
        id: `soccer/all:${e.id}`,
        start: Date.parse(e.date),
        state,
        status: statusLabel(comp.status ?? e.status, state, true),
        // US college soccer and friendlies are numerous but niche, so they sink below other competitions
        league: { id: `other:${note}`, name: note, order: order + (/NCAA|friendly/i.test(note) ? 1 : 0) + (note === "Other competitions" ? 2 : 0) },
        home: home ? sideFromTeam(home) : undefined,
        away: away ? sideFromTeam(away) : undefined,
      };
    });
}

// ── Public API ──────────────────────────────────────────────────────────────

// All games for one sport on one day (YYYY-MM-DD, UTC)
export async function getGames(sport: SportKey, date: string, isToday: boolean): Promise<Game[]> {
  const source = SOURCES[sport];
  const dates = date.replace(/-/g, "");
  // Today changes minute to minute; other days rarely do
  const revalidate = isToday ? 60 : 1800;

  const results = await Promise.allSettled(
    source.leagues.map((path) => cachedJson(`${SITE}/${path}/scoreboard?dates=${dates}&limit=300`, revalidate))
  );
  const games: Game[] = [];
  results.forEach((r, order) => {
    if (r.status !== "fulfilled") return;
    const path = source.leagues[order];
    const data = r.value;
    if (source.kind === "tennis") games.push(...tennisGames(data, path, order, date));
    else if (source.kind === "fight") games.push(...fightGames(data, path, order, date));
    else if (source.kind === "racing") games.push(...racingGames(data, path, order, date));
    else if (source.kind === "golf") games.push(...golfGames(data, path, order));
    else games.push(...teamGames(data, path, order));
  });

  if (source.otherSoccer) {
    try {
      const all = await cachedJson(`${SITE}/soccer/all/scoreboard?dates=${dates}&limit=1000`, revalidate);
      const known = new Set(games.map((g) => g.id.split(":").pop() as string));
      games.push(...otherSoccerGames(all, known, source.leagues.length));
    } catch {
      /* named leagues still show */
    }
  }

  // Nothing loaded at all means ESPN is failing, not that there are no games
  if (results.every((r) => r.status === "rejected")) throw new SportsApiError(UNAVAILABLE);
  return games.filter((g) => Number.isFinite(g.start));
}

// League table for an ESPN league path such as "soccer/eng.1"
export async function getStandings(path: string): Promise<StandingGroup[]> {
  const data = await cachedJson(`https://site.api.espn.com/apis/v2/sports/${path}/standings`, 3 * 3600);
  const children: any[] = data.children?.length ? data.children : [data];
  return children
    .filter((c) => c.standings?.entries?.length)
    .map((c) => ({
      name: c.name,
      rows: c.standings.entries.map((entry: any, i: number) => {
        const stat = (...names: string[]) => {
          for (const n of names) {
            const s = entry.stats?.find((x: any) => x.name === n);
            if (s && s.value !== undefined && s.value !== null) return Number(s.value);
          }
          return undefined;
        };
        const won = stat("wins", "gamesWon");
        const lost = stat("losses", "gamesLost");
        const drawn = stat("ties", "gamesDrawn");
        return {
          rank: stat("rank", "playoffSeed") ?? i + 1,
          team: entry.team?.displayName ?? entry.team?.name ?? "",
          logo: pickLogo(entry.team?.logos),
          played: stat("gamesPlayed") ?? (won !== undefined && lost !== undefined ? won + lost + (drawn ?? 0) : undefined),
          won,
          drawn,
          lost,
          // "points" means league points only in football and rugby tables
          points: /^(soccer|rugby)\//.test(path) ? stat("points") : undefined,
        };
      }).sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank),
    }));
}
