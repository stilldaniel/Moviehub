// Shared sports types and config, safe to import in the browser.
// Data comes from ESPN's public scoreboard feed; see lib/sportsApi.ts (server only).

export type SportKey =
  | "football" | "basketball" | "american-football" | "baseball" | "hockey"
  | "tennis" | "golf" | "motorsport" | "mma" | "rugby";

export const SPORTS: { key: SportKey; label: string }[] = [
  { key: "football", label: "Football" },
  { key: "basketball", label: "Basketball" },
  { key: "american-football", label: "American Football" },
  { key: "baseball", label: "Baseball" },
  { key: "hockey", label: "Hockey" },
  { key: "tennis", label: "Tennis" },
  { key: "golf", label: "Golf" },
  { key: "motorsport", label: "Motorsport" },
  { key: "mma", label: "MMA" },
  { key: "rugby", label: "Rugby" },
];

export const isSportKey = (key: string): key is SportKey => SPORTS.some((s) => s.key === key);

// Show the "Table" button for competitions that have standings
export const TABLES_ENABLED = true;

export type GameState = "scheduled" | "live" | "finished" | "cancelled";
export type Side = { name: string; logo?: string; score?: number | null; winner?: boolean };

// Common shape for every sport. Head-to-head events fill home/away; races and golf use title/subtitle.
export type Game = {
  id: string;
  start: number; // ms since epoch
  state: GameState;
  status: string; // e.g. "FT", "67'", "Q3 5:21", "Top 5th"
  league: {
    id: string;
    name: string;
    logo?: string;
    order: number; // position in our featured list; lower shows first
    table?: string; // ESPN league path when standings exist, e.g. "soccer/eng.1"
  };
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

export class SportsApiError extends Error {}

// UTC date (YYYY-MM-DD) for yesterday, today or tomorrow
export function dayToDate(day: string): string | null {
  const offset = { yesterday: -1, today: 0, tomorrow: 1 }[day];
  if (offset === undefined) return null;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}
