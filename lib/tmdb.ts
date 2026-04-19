const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export async function fetchFromTMDB(endpoint: string) {
  const res = await fetch(
    `${BASE_URL}${endpoint}?api_key=${API_KEY}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}

export const getTrending = () =>
  fetchFromTMDB("/trending/movie/week");

export const getTopRated = () =>
  fetchFromTMDB("/movie/top_rated");

export const getPopular = () =>
  fetchFromTMDB("/movie/popular");
