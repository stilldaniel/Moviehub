import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch History",
  description:
    "See everything you've watched on Zora Stream. Track your progress and revisit your favourite titles.",
  openGraph: {
    title: "Watch History | Zora Stream",
    description: "See everything you've watched on Zora Stream.",
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