import { SportsApiError, TABLES_ENABLED } from "@/lib/sports";
import { getStandings, isTableLeague } from "@/lib/sportsApi";

// GET /api/sports/standings?league=soccer/eng.1
export async function GET(request: Request) {
  const league = new URL(request.url).searchParams.get("league") ?? "";
  if (!TABLES_ENABLED || !isTableLeague(league)) {
    return Response.json({ error: "Tables aren't available for this competition." }, { status: 404 });
  }
  try {
    return Response.json(
      { groups: await getStandings(league) },
      { headers: { "cache-control": "public, max-age=900", "vercel-cdn-cache-control": "max-age=3600" } }
    );
  } catch (error) {
    const message = error instanceof SportsApiError ? error.message : "Couldn't load this table right now.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
