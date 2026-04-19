import TVDetailsClient from "./TVDetailsClient";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export default async function TVDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}&append_to_response=videos`,
    { cache: "no-store" }
  );

  const show = await res.json();

  if (!show || show.success === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Failed to load TV show page
      </div>
    );
  }

  return <TVDetailsClient show={show} />;
}