import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Hero from "@/components/Hero";
import Row from "@/components/Row";
import AnimatedSection from "@/components/AnimatedSection";
import ForYouFeed from "@/components/ForYouFeed";
import { getSafeUser } from "@/lib/supabase";

export default async function HomePage() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = supabaseUrl && supabaseAnonKey
    ? createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // intentionally empty - cookies can only be set in Server Actions
          },
        },
      })
    : null;

  const { data: { user } } = await getSafeUser(supabase?.auth);

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="bg-black min-h-screen text-white">
      <AnimatedSection>
        <Hero />
      </AnimatedSection>

      <div className="px-3 space-y-12 pb-16">
        <AnimatedSection>
          <ForYouFeed />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Trending Now"
            fetchUrl={`/api/tmdb/trending/all/week`}
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Popular Movies"
            fetchUrl={`/api/tmdb/movie/popular`}
            mediaType="movie"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Top Rated Movies"
            fetchUrl={`/api/tmdb/movie/top_rated`}
            mediaType="movie"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Popular TV Series"
            fetchUrl={`/api/tmdb/tv/popular`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Top Rated TV Series"
            fetchUrl={`/api/tmdb/tv/top_rated`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Trending Anime"
            fetchUrl={`/api/tmdb/discover/tv?with_genres=16&with_keywords=210024&sort_by=popularity.desc`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Top Rated Anime"
            fetchUrl={`/api/tmdb/discover/tv?with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Upcoming Movies"
            fetchUrl={`/api/tmdb/movie/upcoming`}
            mediaType="movie"
          />
        </AnimatedSection>
      </div>
    </div>
  );
}