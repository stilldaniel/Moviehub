// API-Sports integration. One key (SPORTS_API_KEY) covers every sport, but the free plan allows
// 100 requests per sport per day, so every request goes through the server with long caching.

export type SportKey =
  | "football" | "basketball" | "american-football" | "baseball" | "hockey"
  | "rugby" | "volleyball" | "handball" | "afl" | "mma" | "formula-1";

type SportConfig = { key: SportKey; label: string; host: string; path: string; standings: boolean };

export const SPORTS: SportConfig[] = [
  { key: "football", label: "Football", host: "v3.football.api-sports.io", path: "fixtures", standings: true },
  { key: "basketball", label: "Basketball", host: "v1.basketball.api-sports.io", path: "games", standings: true },
  { key: "american-football", label: "American Football", host: "v1.american-football.api-sports.io", path: "games", standings: true },
  { key: "baseball", label: "Baseball", host: "v1.baseball.api-sports.io", path: "games", standings: true },
  { key: "hockey", label: "Hockey", host: "v1.hockey.api-sports.io", path: "games", standings: true },
  { key: "rugby", label: "Rugby", host: "v1.rugby.api-sports.io", path: "games", standings: true },
  { key: "volleyball", label: "Volleyball", host: "v1.volleyball.api-sports.io", path: "games", standings: true },
  { key: "handball", label: "Handball", host: "v1.handball.api-sports.io", path: "games", standings: true },
  { key: "afl", label: "AFL", host: "v1.afl.api-sports.io", path: "games", standings: true },
  { key: "mma", label: "MMA", host: "v1.mma.api-sports.io", path: "fights", standings: false },
  { key: "formula-1", label: "Formula 1", host: "v1.formula-1.api-sports.io", path: "races", standings: false },
];

export const sportConfig = (key: string) => SPORTS.find((s) => s.key === key);

// League tables need a paid API-Sports plan: the free plan only serves standings for the
// 2022–2024 seasons. Set this to true after upgrading to show the "Table" buttons again.
export const TABLES_ENABLED = false;

export type GameState = "scheduled" | "live" | "finished" | "cancelled";
export type Side = { name: string; logo?: string; score?: number | null; winner?: boolean };

// Common shape for every sport. Team sports fill home/away; F1 races use title/subtitle instead.
export type Game = {
  id: string;
  start: number; // ms since epoch
  state: GameState;
  status: string; // short status from the API, e.g. "FT", "Q3", "HT", "67'"
  league: { id: number; name: string; country?: string; logo?: string; season?: number | string };
  home?: Side;
  away?: Side;
  title?: string;
  subtitle?: string;
};

export type StandingRow = {
  rank: number;
  team: string;
  logo?: string;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  points?: number;
};
export type StandingGroup = { name?: string; rows: StandingRow[] };

// ── Status ──────────────────────────────────────────────────────────────────

const FINISHED = new Set(["FT", "AET", "PEN", "AOT", "AP", "AW", "FINISHED", "COMPLETED", "ENDED"]);
const SCHEDULED = new Set(["NS", "TBD", "SCHEDULED"]);
const CANCELLED = new Set(["CANC", "PST", "POST", "ABD", "AWD", "WO", "SUSP", "CANCELLED", "POSTPONED", "ABANDONED"]);

function stateFor(short: string): GameState {
  const s = short.toUpperCase();
  if (FINISHED.has(s)) return "finished";
  if (SCHEDULED.has(s)) return "scheduled";
  if (CANCELLED.has(s)) return "cancelled";
  return "live";
}

const num = (v: unknown): number | null => (typeof v === "number" ? v : v == null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);

// Scores come as a number, { total }, or { score } depending on the sport
function score(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  const o = v as { total?: unknown; score?: unknown; points?: unknown };
  return num(o.total ?? o.score ?? o.points);
}

// ── Normalising each API's response ─────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
export function normalizeGames(sport: SportKey, response: any[]): Game[] {
  switch (sport) {
    case "football":
      return response.map((f) => {
        const short: string = f.fixture.status.short;
        const state = stateFor(short);
        return {
          id: String(f.fixture.id),
          start: f.fixture.timestamp * 1000,
          state,
          status: state === "live" && f.fixture.status.elapsed && !["HT", "BT", "P"].includes(short) ? `${f.fixture.status.elapsed}'` : short,
          league: { id: f.league.id, name: f.league.name, country: f.league.country, logo: f.league.logo, season: f.league.season },
          home: { name: f.teams.home.name, logo: f.teams.home.logo, score: f.goals.home, winner: f.teams.home.winner ?? undefined },
          away: { name: f.teams.away.name, logo: f.teams.away.logo, score: f.goals.away, winner: f.teams.away.winner ?? undefined },
        };
      });

    case "american-football":
      return response.map((g) => ({
        id: String(g.game.id),
        start: g.game.date.timestamp * 1000,
        state: stateFor(g.game.status.short),
        status: g.game.status.timer ? `${g.game.status.short} ${g.game.status.timer}` : g.game.status.short,
        league: { id: g.league.id, name: g.league.name, country: g.league.country?.name, logo: g.league.logo, season: g.league.season },
        home: { name: g.teams.home.name, logo: g.teams.home.logo, score: score(g.scores.home) },
        away: { name: g.teams.away.name, logo: g.teams.away.logo, score: score(g.scores.away) },
      }));

    case "afl":
      return response.map((g) => ({
        id: String(g.game.id),
        start: Number(g.timestamp) * 1000,
        state: stateFor(g.status.short),
        status: g.status.short,
        league: { id: g.league.id, name: "AFL", country: "Australia", season: g.league.season },
        home: { name: g.teams.home.name, logo: g.teams.home.logo, score: score(g.scores.home) },
        away: { name: g.teams.away.name, logo: g.teams.away.logo, score: score(g.scores.away) },
      }));

    case "mma":
      return response.map((f) => ({
        id: String(f.id),
        start: f.timestamp * 1000,
        state: stateFor(f.status.short),
        status: f.status.short,
        // Each event (e.g. "UFC Fight Night: …") is grouped like a league
        league: { id: hashId(f.slug ?? "MMA"), name: f.slug ?? "MMA" },
        subtitle: [f.category, f.is_main ? "Main event" : null].filter(Boolean).join(" · "),
        home: { name: f.fighters.first.name, logo: f.fighters.first.logo, winner: f.fighters.first.winner || undefined },
        away: { name: f.fighters.second.name, logo: f.fighters.second.logo, winner: f.fighters.second.winner || undefined },
      }));

    case "formula-1":
      return response.map((r) => {
        const status: string = r.status ?? "";
        return {
          id: String(r.id),
          start: Date.parse(r.date),
          state: stateFor(status),
          status: status === "Completed" ? "Finished" : status,
          league: { id: r.competition.id, name: "Formula 1", country: r.competition.location?.country, season: r.season },
          title: r.competition.name,
          subtitle: [r.type, r.circuit?.name].filter(Boolean).join(" · "),
        };
      });

    default:
      // basketball, baseball, hockey, rugby, volleyball, handball share one shape
      return response.map((g) => {
        const short: string = g.status.short;
        const timer = g.status.timer ?? g.timer;
        return {
          id: String(g.id),
          start: g.timestamp * 1000,
          state: stateFor(short),
          status: timer && stateFor(short) === "live" ? `${short} ${timer}'` : short,
          league: { id: g.league.id, name: g.league.name, country: g.country?.name, logo: g.league.logo, season: g.league.season },
          home: { name: g.teams.home.name, logo: g.teams.home.logo, score: score(g.scores.home) },
          away: { name: g.teams.away.name, logo: g.teams.away.logo, score: score(g.scores.away) },
        };
      });
  }
}

export function normalizeStandings(sport: SportKey, response: any[]): StandingGroup[] {
  // Football nests groups under response[0].league.standings; the others return groups directly
  const groups: any[][] = sport === "football" ? response[0]?.league?.standings ?? [] : response;
  return groups
    .filter((g) => Array.isArray(g) && g.length > 0)
    .map((rows) => ({
      name: typeof rows[0].group === "string" ? rows[0].group : rows[0].group?.name,
      rows: rows.map((r: any) => ({
        rank: num(r.rank ?? r.position) ?? 0,
        team: r.team?.name ?? "",
        logo: r.team?.logo,
        played: num(r.all?.played ?? r.games?.played) ?? undefined,
        won: num(r.all?.win ?? r.games?.win?.total ?? r.games?.win) ?? undefined,
        drawn: num(r.all?.draw ?? r.games?.draw?.total ?? r.games?.draw) ?? undefined,
        lost: num(r.all?.lose ?? r.games?.lose?.total ?? r.games?.lose) ?? undefined,
        // Only league points; basketball-style { for, against } are scores, not table points
        points: typeof r.points === "number" ? r.points : undefined,
      })),
    }));
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function hashId(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Fetching (server only) ──────────────────────────────────────────────────

export class SportsApiError extends Error {}

// Sends one request to API-Sports. `revalidate` keeps each distinct URL cached so the
// 100-requests-per-day free limit per sport isn't exceeded.
export async function sportsRequest(sport: SportConfig, path: string, params: Record<string, string>, revalidate: number) {
  const key = process.env.SPORTS_API_KEY;
  if (!key) throw new SportsApiError("SPORTS_API_KEY is not configured");
  const res = await fetch(`https://${sport.host}/${path}?${new URLSearchParams(params)}`, {
    headers: { "x-apisports-key": key },
    next: { revalidate },
  });
  if (!res.ok) throw new SportsApiError(`API-Sports returned ${res.status}`);
  const data = await res.json();
  // Errors (such as the daily limit) come back with status 200 and a non-empty "errors" field
  const errors = data.errors && (Array.isArray(data.errors) ? data.errors.length : Object.keys(data.errors).length);
  if (errors) {
    const message = JSON.stringify(data.errors);
    throw new SportsApiError(/limit|requests/i.test(message) ? "Today's free data limit for this sport has been reached. Scores will be back tomorrow." : `API-Sports error: ${message}`);
  }
  return data.response ?? [];
}

// UTC date (YYYY-MM-DD) for yesterday, today or tomorrow
export function dayToDate(day: string): string | null {
  const offset = { yesterday: -1, today: 0, tomorrow: 1 }[day];
  if (offset === undefined) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
