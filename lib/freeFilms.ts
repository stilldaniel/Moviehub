// Rules for the "Free to Watch" tab, which browses the Internet Archive's Feature Films collection.
// Only films the Archive itself marks as public domain (or CC0) are ever listed or played.

export type FreeFilm = { id: string; title: string; year?: number; posterPath?: string };

// Adult/exploitation titles slip through otherwise; the Archive's tagging is inconsistent
const BLOCKED_TERMS = [
  "sex", "sexploitation", "nudity", "nudist", "nude", "naked", "erotic", "erotica",
  "burlesque", "striptease", "teaserama", "adult",
];

// Individual items that pass the filters but don't belong in a general movie app
export const BLOCKED_IDS = new Set([
  "TheNakedWitch",
  "InvasionOfTheBeeGirls",
  "nazi_concentration_camps",
]);

export function isPublicDomainLicense(licenseUrl?: string): boolean {
  return !!licenseUrl && /publicdomain/i.test(licenseUrl); // covers both the PD mark and CC0
}

// Archive search query: public-domain feature films with a release year (drops compilations)
export function freeFilmQuery(search?: string): string {
  const terms = BLOCKED_TERMS.join(" OR ");
  const parts = [
    "collection:feature_films",
    "mediatype:movies",
    "licenseurl:*publicdomain*",
    "year:[1890 TO 2100]",
    `-subject:(${terms})`,
    `-title:(${terms})`,
  ];
  // Keep only letters, digits and spaces so user input can't change the query structure
  const clean = search?.replace(/[^\p{L}\p{N} ]/gu, " ").trim().slice(0, 60);
  if (clean) parts.push(`title:(${clean})`);
  return parts.join(" AND ");
}

export function archivePosterUrl(id: string): string {
  return `https://archive.org/services/img/${encodeURIComponent(id)}`;
}
