import { dayToDate, isSportKey, SportsApiError } from "@/lib/sports";
import { getGames } from "@/lib/sportsApi";

// GET /api/sports/games?sport=football&day=today|yesterday|tomorrow
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const sport = params.get("sport") ?? "";
  const day = params.get("day") ?? "today";
  const date = dayToDate(day);
  if (!isSportKey(sport) || !date) return Response.json({ error: "Unknown sport or day" }, { status: 400 });

  try {
    const games = (await getGames(sport, date, day === "today")).sort((a, b) => a.start - b.start);
    return Response.json(
      { games, date },
      {
        headers: {
          "cache-control": "public, max-age=30",
          "vercel-cdn-cache-control": `max-age=${day === "today" ? 60 : 1800}, stale-while-revalidate=120`,
        },
      }
    );
  } catch (error) {
    const message = error instanceof SportsApiError ? error.message : "Scores are temporarily unavailable. Please check back later.";
    return Response.json({ error: message }, { status: 502, headers: { "cache-control": "no-store" } });
  }
}
