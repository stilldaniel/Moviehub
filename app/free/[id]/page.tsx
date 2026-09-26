import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { archiveEmbedUrl, tmdbIdForArchive } from "@/lib/freeClassics";
import { BLOCKED_IDS, isPublicDomainLicense } from "@/lib/freeFilms";
import { mediaHref } from "@/lib/utils";

type ArchiveFilm = { id: string; title: string; year?: string; runtime?: string; description?: string };

// Only returns films the Archive marks as public domain; anything else is treated as not found
const getFilm = cache(async (id: string): Promise<ArchiveFilm | null> => {
  if (BLOCKED_IDS.has(id)) return null;
  const res = await fetch(`https://archive.org/metadata/${encodeURIComponent(id)}`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.metadata;
  if (!meta || meta.mediatype !== "movies" || !isPublicDomainLicense(meta.licenseurl)) return null;

  const first = (v: unknown) => (Array.isArray(v) ? v[0] : v) as string | undefined;
  const description = first(meta.description)
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

  return { id, title: first(meta.title) ?? id, year: first(meta.year), runtime: first(meta.runtime), description };
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const film = await getFilm(decodeURIComponent(id));
  if (!film) return { title: "Film Not Found" };
  return {
    title: `Watch ${film.title}${film.year ? ` (${film.year})` : ""} free`,
    description: film.description?.slice(0, 160) || `${film.title} is in the public domain. Watch it free on Zora Stream.`,
  };
}

export default async function FreeFilmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  // Hand-picked classics have a richer TMDB details page with the same player
  const tmdbId = tmdbIdForArchive(id);
  if (tmdbId) redirect(mediaHref("movie", tmdbId));

  const film = await getFilm(id);
  if (!film) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-10">
      <Link href="/movie?tab=free" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-5">
        <FaArrowLeft size={11} /> Free to Watch
      </Link>

      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{film.title}</h1>
      <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
        {film.year && <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">{film.year}</span>}
        {film.runtime && <span className="bg-gray-700 px-2.5 py-0.5 rounded-md">{film.runtime}</span>}
        <span className="bg-emerald-900/60 text-emerald-300 px-2.5 py-0.5 rounded-md">Public domain</span>
      </div>

      <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black shadow-lg">
        <iframe src={archiveEmbedUrl(film.id)} title={`Watch ${film.title}`} className="w-full h-full" allow="fullscreen" allowFullScreen />
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Streaming from the{" "}
        <a href={`https://archive.org/details/${encodeURIComponent(film.id)}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">
          Internet Archive
        </a>
        .
      </p>

      {film.description && (
        <div className="max-w-3xl mt-8">
          <h2 className="text-gray-400 text-xs uppercase tracking-wider mb-3">About</h2>
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line line-clamp-12">{film.description}</p>
        </div>
      )}
    </div>
  );
}
