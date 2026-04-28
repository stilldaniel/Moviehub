import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for movies, TV shows, and anime on MovieApp. Find ratings, trailers, and recommendations.",
  openGraph: {
    title: "Search | MovieApp",
    description: "Search for movies, TV shows, and anime on MovieApp.",
    type: "website",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}