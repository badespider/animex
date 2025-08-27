import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import QueryProvider from "@/providers/QueryProvider";
import PostHogProvider from "@/providers/PostHogProvider";
import SiteHeader from "@/components/site-header";
import ConsentBanner from "@/components/ConsentBanner";
import ThemeProvider from "@/components/theme-provider";
import BackgroundLines from "@/components/BackgroundLines";

export const metadata: Metadata = {
  title: "animex",
  description: "Anime browser powered by AniList",
  referrer: "strict-origin-when-cross-origin",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icons/icon.svg", type: "image/svg+xml" }
    ]
  }
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PostHogProvider />
        <ThemeProvider>
          <QueryProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only fixed left-3 top-3 z-50 px-3 py-1 rounded border bg-[var(--background)]/90 backdrop-blur"
            >
              Skip to content
            </a>
            <BackgroundLines />
            <SiteHeader />
            <main id="main" className="relative z-10 min-h-screen max-w-6xl mx-auto p-4">{children}</main>
            <ConsentBanner />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
