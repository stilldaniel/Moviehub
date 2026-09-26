import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description:
    "Manage your Zora Stream profile, subscription, watch history, ratings, and account settings.",
  openGraph: {
    title: "My Profile | Zora Stream",
    description: "Manage your Zora Stream profile, subscription, and account settings.",
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