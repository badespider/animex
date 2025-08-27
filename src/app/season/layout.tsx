import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Season • animex",
  description: "Browse seasonal anime by year, season, format, and genre",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

