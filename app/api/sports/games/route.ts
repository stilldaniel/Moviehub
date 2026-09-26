import { dayToDate, normalizeGames, sportConfig, SportsApiError, sportsRequest } from "@/lib/sports";

// GET /api/sports/games?sport=football&day=today|yesterday|tomorrow
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sport = sportConfig(params.get("sport") ?? "");
  const day = params.get("day") ?? "today";
  const date = dayToDate(day);
  if (!sport || !date) return Response.json({ error: "Unknown sport or day" }, { status: 400 });

  // Today's scores refresh every 20 minutes (~72 requests/day); other days rarely change
  const revalidate = day === "today" ? 1200 : 21600;
  try {
    const raw = await sportsRequest(sport, sport.path, { date }, revalidate);
    const games = normalizeGames(sport.key, raw).sort((a, b) => a.start - b.start);
    return Response.json(
      { games, date },
      {
        headers: {
          "cache-control": "public, max-age=120",
          "vercel-cdn-cache-control": `max-age=${day === "today" ? 300 : 3600}, stale-while-revalidate=600`,
        },
      }
    );
  } catch (error) {
    const message = error instanceof SportsApiError ? error.message : "Couldn't load scores right now.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
