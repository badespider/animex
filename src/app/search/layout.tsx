import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search • animex",
  description: "Search anime via AniList",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

