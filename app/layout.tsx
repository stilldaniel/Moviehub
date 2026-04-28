import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/layout/Navbar";

export const metadata: Metadata = {
  title: {
    default: "MovieApp — Discover Movies, TV Shows & Anime",
    template: "%s | MovieApp",
  },
  description:
    "Discover and explore thousands of movies, TV shows, and anime. Get ratings, trailers, and personalised recommendations on MovieApp.",
  keywords: ["movies", "TV shows", "anime", "streaming", "film discovery", "watch list"],
  openGraph: {
    title: "MovieApp — Discover Movies, TV Shows & Anime",
    description:
      "Discover and explore thousands of movies, TV shows, and anime. Get ratings, trailers, and personalised recommendations.",
    type: "website",
    locale: "en_US",
    siteName: "MovieApp",
  },
  twitter: {
    card: "summary_large_image",
    title: "MovieApp — Discover Movies, TV Shows & Anime",
    description:
      "Discover and explore thousands of movies, TV shows, and anime.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}