import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import Hero from "@/components/Hero";
import Row from "@/components/Row";
import AnimatedSection from "@/components/AnimatedSection";
import ForYouFeed from "@/components/ForYouFeed";
import { getSafeUser } from "@/lib/supabase";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export default async function HomePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // intentionally empty - cookies can only be set in Server Actions
        },
      },
    }
  );

  const { data: { user } } = await getSafeUser(supabase.auth);

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
            fetchUrl={`https://api.themoviedb.org/3/trending/all/week?api_key=${API_KEY}`}
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Popular Movies"
            fetchUrl={`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`}
            mediaType="movie"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Top Rated Movies"
            fetchUrl={`https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}`}
            mediaType="movie"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Popular TV Series"
            fetchUrl={`https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Top Rated TV Series"
            fetchUrl={`https://api.themoviedb.org/3/tv/top_rated?api_key=${API_KEY}`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Trending Anime"
            fetchUrl={`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&with_keywords=210024&sort_by=popularity.desc`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Top Rated Anime"
            fetchUrl={`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=16&with_keywords=210024&sort_by=vote_average.desc&vote_count.gte=100`}
            mediaType="tv"
          />
        </AnimatedSection>

        <AnimatedSection>
          <Row
            title="Upcoming Movies"
            fetchUrl={`https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}`}
            mediaType="movie"
          />
        </AnimatedSection>
      </div>
    </div>
  );
}