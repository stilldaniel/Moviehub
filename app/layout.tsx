import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import FavoritesProvider from "../components/FavoritesProvider";
import MotionProvider from "../components/MotionProvider";

export const metadata: Metadata = {
  title: {
    default: "Zora Stream — Movies, TV, Anime & Live Sports",
    template: "%s | Zora Stream",
  },
  description:
    "Discover movies, TV shows and anime, watch free classics, and follow live sports. Ratings, trailers, where to watch and personalised picks on Zora Stream.",
  keywords: ["Zora Stream", "movies", "TV shows", "anime", "free movies", "live sports", "scores", "where to watch"],
  openGraph: {
    title: "Zora Stream — Movies, TV, Anime & Live Sports",
    description:
      "Movies, TV shows and anime, free classics to watch in full, and live sports scores and streams.",
    type: "website",
    locale: "en_US",
    siteName: "Zora Stream",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zora Stream — Movies, TV, Anime & Live Sports",
    description:
      "Movies, TV shows and anime, free classics to watch in full, and live sports scores and streams.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <MotionProvider>
          <FavoritesProvider>
            <Navbar />
            <main>{children}</main>
          </FavoritesProvider>
        </MotionProvider>
      </body>
    </html>
  );
}