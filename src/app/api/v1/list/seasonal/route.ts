import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/fetch";
import { getOrSet } from "@/lib/redis";
import { rateLimit } from "@/lib/rateLimit";

const schema = z.object({
  season: z
    .enum(["WINTER", "SPRING", "SUMMER", "FALL"]).optional(),
  year: z.coerce.number().int().min(1970).max(2999).optional(),
  format: z.enum(["TV", "TV_SHORT", "OVA", "ONA", "MOVIE", "SPECIAL", "MUSIC"]).optional(),
  genres: z.string().optional(), // comma-separated list of genres
  sort: z.enum(["TRENDING", "POPULARITY", "SCORE"]).optional(),
  status: z.string().optional(), // comma-separated status values: FINISHED,RELEASING,NOT_YET_RELEASED
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function currentSeasonYear(date = new Date()) {
  const m = date.getUTCMonth() + 1; // 1..12
  const y = date.getUTCFullYear();
  if (m === 12 || m <= 2) return { season: "WINTER" as const, year: m === 12 ? y + 1 : y }; // AniList winter often spans year turn
  if (m >= 3 && m <= 5) return { season: "SPRING" as const, year: y };
  if (m >= 6 && m <= 8) return { season: "SUMMER" as const, year: y };
  return { season: "FALL" as const, year: y };
}

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.safeParse({
    season: searchParams.get("season") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    format: searchParams.get("format") ?? undefined,
    genres: (() => {
      const multi = searchParams.getAll("genres");
      if (multi && multi.length > 1) return multi.join(",");
      return searchParams.get("genres") ?? undefined;
    })(),
    sort: searchParams.get("sort") ?? undefined,
    status: (() => {
      const multi = searchParams.getAll("status");
      if (multi && multi.length > 1) return multi.join(",");
      return searchParams.get("status") ?? undefined;
    })(),
    page: searchParams.get("page") ?? "1",
    limit: searchParams.get("limit") ?? "20",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }
  let { season, year, format, genres, sort, status, page, limit } = parsed.data;
  if (!season || !year) {
    const d = currentSeasonYear();
    season = season ?? d.season;
    year = year ?? d.year;
  }

  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `${ip}:seasonal`, limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please wait." } }, { status: 429 });
  }

  const cacheKey = `list:seasonal:${season}:${year}:${format ?? "any"}:${genres ?? "any"}:${sort ?? "TRENDING"}:${status ?? "any"}:${page}:${limit}`;
  try {
    const { data, cached } = await getOrSet(cacheKey, 10 * 60, async () => {
      const gql = `query ($page:Int,$perPage:Int,$season:MediaSeason,$seasonYear:Int,$format:MediaFormat,$genres:[String],$sort:[MediaSort],$status:[MediaStatus]){
        Page(page:$page, perPage:$perPage){
          pageInfo{ total perPage currentPage lastPage hasNextPage }
          media(season:$season, seasonYear:$seasonYear, type: ANIME, format:$format, genre_in:$genres, sort:$sort, status_in:$status){
            id
            title{ english romaji native }
            coverImage{ extraLarge large medium }
            seasonYear
            format
          }
        }
      }`;

      // Parse genres list and status list
      const genresList = (genres ?? "").split(",").map(g => g.trim()).filter(Boolean);
      const statusList = (status ?? "").split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
      // Map sort to AniList enum
      const sortMap: Record<string, string> = { TRENDING: "TRENDING_DESC", POPULARITY: "POPULARITY_DESC", SCORE: "SCORE_DESC" };
      const sortVal = sort ? [sortMap[sort] || "TRENDING_DESC"] : ["TRENDING_DESC"];
      const res = await fetchWithRetry(
        "https://graphql.anilist.co",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query: gql, variables: { page, perPage: limit, season, seasonYear: year, format, genres: genresList.length ? genresList : undefined, sort: sortVal, status: statusList.length ? statusList : undefined } }),
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

      const root = (await res.json()) as Record<string, unknown>;
      const pageNode = ((root.data as any)?.Page ?? {}) as Record<string, unknown>;
      const pageInfo = (pageNode.pageInfo ?? {}) as Record<string, unknown>;
      const mediaRaw = Array.isArray(pageNode.media) ? (pageNode.media as unknown[]) : [];

      const items = mediaRaw.map((m) => {
        const rec = (m ?? {}) as Record<string, unknown>;
        const id = String(rec.id ?? "");
        const t = (rec.title ?? {}) as Record<string, unknown>;
        const title = String(t.english ?? t.romaji ?? t.native ?? "Untitled");
        const ci = (rec.coverImage ?? {}) as Record<string, unknown>;
        const cover = [ci.extraLarge, ci.large, ci.medium].find((v) => typeof v === "string") as string | undefined;
        const yearNum = Number(rec.seasonYear);
        const yearV = Number.isFinite(yearNum) && yearNum > 0 ? yearNum : undefined;
        const type = typeof rec.format === "string" ? (rec.format as string) : undefined;
        return { id, title, cover, year: yearV, type };
      });

      const currentPage = Number(pageInfo.currentPage ?? page) || page;
      const total = Number(pageInfo.total ?? items.length) || items.length;
      return { items, page: currentPage, total };
    });

    const resp = NextResponse.json(data, { status: 200 });
    resp.headers.set("X-Cache", cached ? "HIT" : "MISS");
    return resp;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}

