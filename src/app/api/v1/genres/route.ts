import { NextResponse } from "next/server";
import { getOrSet } from "@/lib/redis";
import { rateLimit } from "@/lib/rateLimit";
import { fetchWithRetry } from "@/lib/fetch";

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "127.0.0.1";
  const rl = await rateLimit({ key: `${ip}:genres`, limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please wait." } }, { status: 429 });
  }

  try {
    const { data, cached } = await getOrSet("anilist:genres", 12 * 60 * 60, async () => {
      const gql = `query { GenreCollection }`;
      const res = await fetchWithRetry(
        "https://graphql.anilist.co",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: gql }),
          timeoutMs: 10_000,
        },
        1,
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`AniList error: ${res.status} ${txt}`);
      }
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const txt = await res.text().catch(() => "");
        throw new Error(`AniList returned non-JSON (${ct}): ${txt.slice(0, 300)}`);
      }
      const root = (await res.json()) as any;
      const genres = Array.isArray(root?.data?.GenreCollection) ? root.data.GenreCollection.filter((g: any) => typeof g === "string") : [];
      return { items: genres };
    });
    const resp = NextResponse.json(data, { status: 200 });
    resp.headers.set("X-Cache", cached ? "HIT" : "MISS");
    return resp;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}
