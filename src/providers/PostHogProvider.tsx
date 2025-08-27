"use client";
import posthog from "posthog-js";
import { useEffect } from "react";

const KEY = "animex:consent";

export function useAnalyticsEnabled() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "granted";
}

export default function PostHogProvider() {
  useEffect(() => {
    const enabled = typeof window !== "undefined" && localStorage.getItem(KEY) === "granted";
    const key = process.env.NEXT_PUBLIC_ANALYTICS_KEY;
    if (enabled && key) {
      posthog.init(key, { api_host: "https://app.posthog.com", capture_pageview: true });
    }
  }, []);
  return null;
}

export function track(event: string, props?: Record<string, unknown>) {
  try {
    posthog?.capture?.(event, props);
  } catch {}
}
