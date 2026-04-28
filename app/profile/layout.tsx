import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description:
    "Manage your MovieApp profile, subscription, watch history, ratings, and account settings.",
  openGraph: {
    title: "My Profile | MovieApp",
    description: "Manage your MovieApp profile, subscription, and account settings.",
    type: "website",
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}