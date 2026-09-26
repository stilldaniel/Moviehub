// TMDB serves every image pre-resized, so pick the smallest size that looks sharp
// instead of routing posters through an image optimiser.
const TMDB_IMG = "https://image.tmdb.org/t/p";

type PosterSize = "w92" | "w154" | "w185" | "w342" | "w500";
type BackdropSize = "w780" | "w1280";

export const tmdbPoster = (path: string, size: PosterSize = "w342") => `${TMDB_IMG}/${size}${path}`;

// Backdrops were loading "original" (up to 4K and several MB); 1280px covers full-width hero banners
export const tmdbBackdrop = (path: string, size: BackdropSize = "w1280") => `${TMDB_IMG}/${size}${path}`;

// Lets the browser choose between sizes for the card's rendered width and screen density
export const posterSrcSet = (path: string) =>
  `${TMDB_IMG}/w185${path} 185w, ${TMDB_IMG}/w342${path} 342w, ${TMDB_IMG}/w500${path} 500w`;

// Rendered widths of MovieCard (see its width classes and the page grids)
export const POSTER_SIZES = {
  row: "(min-width: 768px) 224px, (min-width: 640px) 192px, 160px",
  grid: "(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw",
};
