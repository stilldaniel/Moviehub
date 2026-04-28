import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Anime",
  description:
    "Dive into the world of anime. Browse popular series, movies, and hidden gems by type, year, and rating on MovieApp.",
  openGraph: {
    title: "Explore Anime | MovieApp",
    description:
      "Dive into the world of anime. Browse popular series, movies, and hidden gems.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Anime | MovieApp",
    description: "Dive into the world of anime on MovieApp.",
  },
};

export default function AnimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}