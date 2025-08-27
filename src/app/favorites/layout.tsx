import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Favorites • animex",
  description: "Your saved anime",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

