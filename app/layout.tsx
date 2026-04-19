import type { Metadata } from "next";
import "../app/globals.css";
import Navbar from "../components/layout/Navbar";

export const metadata: Metadata = {
  title: "MovieApp",
  description: "Discover movies, TV shows and anime",
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