// Converts a title to a URL-safe slug
// e.g. "The Dark Knight" → "the-dark-knight"
// e.g. "Spider-Man: No Way Home" → "spider-man-no-way-home"
export function toSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")   // remove special chars except hyphens
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse multiple hyphens
    .replace(/^-|-$/g, "");          // trim leading/trailing hyphens
}

// Canonical details-page URL: /movie/155-the-dark-knight or /tv/1396-breaking-bad
export function mediaHref(mediaType: string, id: number, title?: string): string {
  const type = mediaType === "tv" ? "tv" : "movie";
  const slug = title ? toSlug(title) : "";
  return `/${type}/${slug ? `${id}-${slug}` : id}`;
}
