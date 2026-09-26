import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Favorites",
  description:
    "Your saved movies and TV shows all in one place. Manage your watchlist on Zora Stream.",
  openGraph: {
    title: "My Favorites | Zora Stream",
    description: "Your saved movies and TV shows all in one place.",
    type: "website",
  },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}