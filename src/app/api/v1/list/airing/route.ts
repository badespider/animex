import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/fetch";
import { rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

function thisWeekRange(): { start: number; end: number } {
  const now = Date.now();
  const start = Math.floor(now / 1000);
  const end = start + 7 * 24 * 60 * 60; // next 7 days
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "50",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  const { page, limit } = parsed.data;

  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `${ip}:airing`, limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please wait." } }, { status: 429 });
  }

  const { start, end } = thisWeekRange();

  try {
    const gql = `query ($page:Int,$perPage:Int,$start:Int,$end:Int){
      Page(page:$page, perPage:$perPage){
        pageInfo{ total perPage currentPage lastPage hasNextPage }
        airingSchedules(airingAt_greater:$start, airingAt_lesser:$end, notYetAired:true){
          id
          episode
          airingAt
          timeUntilAiring
          media{
            id
            title{ english romaji native }
            coverImage{ extraLarge large medium }
            seasonYear
            format
          }
        }
      }
    }`;

    const res = await fetchWithRetry(
      "https://graphql.anilist.co",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: gql, variables: { page, perPage: limit, start, end } }),
        timeoutMs: 10_000,
      },
      1,
    );

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json({ error: { code: "ANILIST_ERROR", message: `${res.status} ${txt}` } }, { status: 502 });
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json({ error: { code: "ANILIST_BAD_CONTENT", message: txt.slice(0, 200) } }, { status: 502 });
    }

    const root = (await res.json()) as any;
    const pageNode = root?.data?.Page ?? {};
    const sched: any[] = Array.isArray(pageNode.airingSchedules) ? pageNode.airingSchedules : [];

    // Deduplicate by media id, choose earliest airing in window
    const byMedia = new Map<string, any>();
    for (const s of sched) {
      const media = s?.media;
      if (!media) continue;
      const id = String(media.id ?? "");
      const prev = byMedia.get(id);
      if (!prev || (s.airingAt || 0) < (prev.airingAt || 0)) byMedia.set(id, s);
    }

    const items = Array.from(byMedia.values()).map((s) => {
      const m = s.media || {};
      const id = String(m.id ?? "");
      const t = m.title || {};
      const title = String(t.english ?? t.romaji ?? t.native ?? "Untitled");
      const ci = m.coverImage || {};
      const cover = [ci.extraLarge, ci.large, ci.medium].find((v: any) => typeof v === "string");
      const year = Number.isFinite(Number(m.seasonYear)) ? Number(m.seasonYear) : undefined;
      const type = typeof m.format === "string" ? m.format : undefined;
      const next = { episode: s.episode, airingAt: s.airingAt, in: s.timeUntilAiring };
      return { id, title, cover, year, type, next };
    });

    return NextResponse.json({ items, page: Number(pageNode?.pageInfo?.currentPage ?? page) || page, total: items.length }, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}

