import type { MetadataRoute } from "next";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();
  const routes = ["/", "/search", "/trending", "/popular", "/season", "/airing", "/favorites"].map((p) => ({
    url: `${origin}${p}`,
    changeFrequency: "daily" as const,
    priority: p === "/" ? 1 : 0.7,
  }));
  return routes;
}

