import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sports",
  description: "Scores and fixtures across football, basketball, hockey, rugby and more, plus free official live streams.",
};

export default function SportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
