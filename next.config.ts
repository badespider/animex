import type { NextConfig } from "next";
import withPWA from "next-pwa";

const baseConfig: NextConfig = {
  // Pin the Turbopack root to this project to avoid workspace root mis-detection in dev
  turbopack: {
    root: __dirname,
  },
  // Allow production builds to succeed even if ESLint finds issues.
  // We still lint in CI or locally, but we don't block deploys.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";

    if (!isProd) {
      // Development: relax headers to avoid breaking Next.js dev overlay and RSC streaming
      const cspDev = [
        "default-src 'self' blob: data:;",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:;",
        "style-src 'self' 'unsafe-inline';",
        "img-src 'self' data: blob: https: http:;",
        "connect-src 'self' http: https: ws: wss:;",
        "worker-src 'self' blob:;",
        "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;",
        "font-src 'self' data: https:;",
        "object-src 'none';",
        "base-uri 'self';",
        "form-action 'self';",
      ].join(" ");

      return [
        {
          source: "/(.*)",
          headers: [
            { key: "Content-Security-Policy", value: cspDev },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Content-Type-Options", value: "nosniff" },
            // Note: no X-Frame-Options in dev
          ],
        },
      ];
    }

    // Production: keep your existing strict policy
    const allowedFrames = (process.env.ALLOWED_IFRAME_HOSTS ?? "").split(/[\s,]+/).filter(Boolean);
    const frameSrc = allowedFrames.length ? ["'self'", ...allowedFrames.map(h => `https://${h}`)].join(" ") : "'none'";
    const csp = [
      "default-src 'self';",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: blob: https: http:;",
      "connect-src 'self' https: http:;",
      `frame-src ${frameSrc};`,
      "font-src 'self' data: https:;",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

const withPWAFn = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

export default withPWAFn({
  ...baseConfig,
});
