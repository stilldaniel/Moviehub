import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search for movies, TV shows, and anime on Zora Stream. Find ratings, trailers, and recommendations.",
  openGraph: {
    title: "Search | Zora Stream",
    description: "Search for movies, TV shows, and anime on Zora Stream.",
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