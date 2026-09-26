import { normalizeStandings, sportConfig, SportsApiError, sportsRequest, TABLES_ENABLED } from "@/lib/sports";

// GET /api/sports/standings?sport=football&league=39&season=2026
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sport = sportConfig(params.get("sport") ?? "");
  const league = params.get("league") ?? "";
  const season = params.get("season") ?? "";
  if (!TABLES_ENABLED) {
    return Response.json({ error: "League tables aren't available on the current data plan." }, { status: 404 });
  }
  if (!sport?.standings || !/^\d+$/.test(league) || !/^\d{4}(-\d{4})?$/.test(season)) {
    return Response.json({ error: "Tables aren't available for this competition." }, { status: 400 });
  }

  try {
    // Tables change at most a few times a day; cache for 12 hours to save the daily quota
    const raw = await sportsRequest(sport, "standings", { league, season }, 43200);
    return Response.json(
      { groups: normalizeStandings(sport.key, raw) },
      { headers: { "cache-control": "public, max-age=1800", "vercel-cdn-cache-control": "max-age=21600" } }
    );
  } catch (error) {
    const message = error instanceof SportsApiError ? error.message : "Couldn't load this table right now.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
