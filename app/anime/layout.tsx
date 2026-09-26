import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Anime",
  description:
    "Dive into the world of anime. Browse popular series, movies, and hidden gems by type, year, and rating on Zora Stream.",
  openGraph: {
    title: "Explore Anime | Zora Stream",
    description:
      "Dive into the world of anime. Browse popular series, movies, and hidden gems.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Anime | Zora Stream",
    description: "Dive into the world of anime on Zora Stream.",
  },
};

export default function AnimeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}