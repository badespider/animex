import type { MetadataRoute } from "next";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";
}

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

