import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Airing • animex",
  description: "Shows airing in the next 7 days",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

