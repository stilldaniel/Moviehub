import MovieDetailsClient from "./MovieDetailsClient";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export default async function MovieDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&append_to_response=videos`,
    { cache: "no-store" }
  );

  const movie = await res.json();

  if (!movie || movie.success === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Failed to load movie page
      </div>
    );
  }

  return <MovieDetailsClient movie={movie} />;
}