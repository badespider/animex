import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/fetch";
import { getOrSet } from "@/lib/redis";
import { rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  q: z.string().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({
    q: searchParams.get("q"),
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  const { q, page, limit } = parsed.data;
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: ip, limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please wait." } }, { status: 429 });
  }

  // Use AniList GraphQL for search (reliable), keep response shape the same
  const cacheKey = `search:${q.toLowerCase()}:${page}:${limit}`;
  try {
    const { data, cached } = await getOrSet(cacheKey, 6 * 60 * 60, async () => {
      const gql = `query ($page:Int,$perPage:Int,$search:String){
        Page(page:$page, perPage:$perPage){
          pageInfo{ total perPage currentPage lastPage hasNextPage }
          media(search:$search, type: ANIME){
            id
            title{ english romaji native }
            coverImage{ extraLarge large medium }
            seasonYear
            format
          }
        }
      }`;

      const res = await fetchWithRetry(
        "https://graphql.anilist.co",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query: gql, variables: { page, perPage: limit, search: q } }),
          timeoutMs: 10_000,
        },
        1
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
      const root = (await res.json()) as Record<string, unknown>;
      const dataNode = root.data as Record<string, unknown> | undefined;
      const pageNode = (dataNode?.Page ?? {}) as Record<string, unknown>;
      const pageInfo = (pageNode.pageInfo ?? {}) as Record<string, unknown>;
      const mediaRaw = Array.isArray(pageNode.media) ? (pageNode.media as unknown[]) : [];

      const items = mediaRaw.map((m): { id: string; title: string; cover?: string; year?: number; type?: string } => {
        const rec = (m ?? {}) as Record<string, unknown>;
        const id = String(rec.id ?? "");
        const t = (rec.title ?? {}) as Record<string, unknown>;
        const title = String(t.english ?? t.romaji ?? t.native ?? "Untitled");
        const ci = (rec.coverImage ?? {}) as Record<string, unknown>;
        const cover = [ci.extraLarge, ci.large, ci.medium].find((v) => typeof v === "string") as string | undefined;
        const yearNum = Number(rec.seasonYear);
        const year = Number.isFinite(yearNum) && yearNum > 0 ? yearNum : undefined;
        const type = typeof rec.format === "string" ? (rec.format as string) : undefined;
        return { id, title, cover, year, type };
      });

      const currentPage = Number(pageInfo.currentPage ?? page) || page;
      const total = Number(pageInfo.total ?? items.length) || items.length;
      return { items, page: currentPage, total };
    });
    const resp = NextResponse.json(data, { status: 200 });
    resp.headers.set("X-Cache", cached ? "HIT" : "MISS");
    return resp;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}
