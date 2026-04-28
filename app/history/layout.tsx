import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch History",
  description:
    "See everything you've watched on MovieApp. Track your progress and revisit your favourite titles.",
  openGraph: {
    title: "Watch History | MovieApp",
    description: "See everything you've watched on MovieApp.",
    type: "website",
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}