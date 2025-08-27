import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trending • animex",
  description: "Popular right now on AniList",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

