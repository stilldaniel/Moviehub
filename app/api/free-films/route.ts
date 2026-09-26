import { BLOCKED_IDS, freeFilmQuery, type FreeFilm } from "@/lib/freeFilms";
import { fetchFromTMDB } from "@/lib/tmdb";

const PAGE_SIZE = 30;

// The Archive's thumbnails are random frames, so borrow the TMDB poster when title and year match exactly
async function tmdbPoster(title: string, year?: number): Promise<string | undefined> {
  if (!year) return undefined;
  try {
    const data = await fetchFromTMDB("/search/movie", { query: title, year: String(year) });
    const match = data.results?.find(
      (r: { release_date?: string; poster_path?: string }) => r.poster_path && r.release_date?.startsWith(String(year))
    );
    return match?.poster_path;
  } catch {
    return undefined;
  }
}

// Public-domain films from the Internet Archive, most watched first.
// GET /api/free-films?page=1&q=optional+title+search
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const page = Math.min(Math.max(Number(params.get("page")) || 1, 1), 300);
  const search = params.get("q") ?? "";

  const query = new URLSearchParams({
    q: freeFilmQuery(search),
    rows: String(PAGE_SIZE),
    page: String(page),
    output: "json",
  });
  for (const field of ["identifier", "title", "year"]) query.append("fl[]", field);
  query.append("sort[]", "downloads desc");

  const res = await fetch(`https://archive.org/advancedsearch.php?${query}`, { next: { revalidate: 3600 } });
  if (!res.ok) {
    return Response.json({ error: "The Internet Archive didn't respond. Try again shortly." }, { status: 502 });
  }

  const data = await res.json();
  const docs: { identifier: string; title: string; year?: string | number }[] = data.response?.docs ?? [];
  const films: FreeFilm[] = await Promise.all(
    docs
      .filter((d) => !BLOCKED_IDS.has(d.identifier))
      .map(async (d) => {
        const year = d.year ? Number(d.year) : undefined;
        return { id: d.identifier, title: d.title, year, posterPath: await tmdbPoster(d.title, year) };
      })
  );

  return Response.json(
    { films, hasMore: page * PAGE_SIZE < (data.response?.numFound ?? 0) },
    {
      headers: {
        // Browsers keep it briefly; Vercel's CDN keeps it longer and refreshes in the background
        "cache-control": "public, max-age=300",
        "vercel-cdn-cache-control": "max-age=3600, stale-while-revalidate=86400",
      },
    }
  );
}
