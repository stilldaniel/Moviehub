import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
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
      <body className="bg-canvas text-fg">
        <MotionProvider>
          <FavoritesProvider>
            {/* First thing keyboard users reach: jump past the header */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
            >
              Skip to content
            </a>
            <Navbar />
            <main id="main" tabIndex={-1} className="outline-none">{children}</main>
            <Footer />
          </FavoritesProvider>
        </MotionProvider>
      </body>
    </html>
  );
}