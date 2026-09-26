// Proxies browser requests to TMDB so the API key stays on the server.
// Only the read-only endpoints the app uses are allowed through.
const ALLOWED = /^(movie|tv|trending|discover|genre|search)(\/[\w-]+)*$/;

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const endpoint = path.join("/");
  if (!ALLOWED.test(endpoint)) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "TMDB_API_KEY is not configured" }, { status: 500 });
  }

  const query = new URL(request.url).searchParams;
  query.set("api_key", apiKey);

  const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?${query}`, {
    next: { revalidate: 3600 },
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      "content-type": "application/json",
      // Browsers keep it briefly; Vercel's CDN keeps it longer and refreshes in the background
      "cache-control": res.ok ? "public, max-age=300" : "no-store",
      ...(res.ok ? { "vercel-cdn-cache-control": "max-age=3600, stale-while-revalidate=86400" } : {}),
    },
  });
}
