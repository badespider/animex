import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Popular • animex",
  description: "Most popular anime on AniList",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

