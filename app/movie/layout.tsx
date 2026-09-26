import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discover Movies",
  description:
    "Browse thousands of movies by genre, year, and rating. Find your next favourite film on Zora Stream.",
  openGraph: {
    title: "Discover Movies | Zora Stream",
    description:
      "Browse thousands of movies by genre, year, and rating. Find your next favourite film.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Movies | Zora Stream",
    description: "Browse thousands of movies by genre, year, and rating.",
  },
};

export default function MovieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}