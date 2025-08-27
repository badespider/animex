import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { fetchWithRetry } from "@/lib/fetch";
import { getOrSet } from "@/lib/redis";
import { rateLimit } from "@/lib/rateLimit";
import type { AnimeInfoResponse, AnimeMeta } from "@/lib/normalize";

const ParamsSchema = z.object({ id: z.string().min(1) });

function getClientIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "127.0.0.1";
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: parsed.error.message } }, { status: 400 });
  }

  const id = parsed.data.id;
  const ip = getClientIp(req);
  const rl = await rateLimit({ key: ip, limit: 60, windowSeconds: 60 });
  if (!rl.allowed) {
    return NextResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests. Please wait." } }, { status: 429 });
  }

  const cacheKey = `anime:${id}`;
  try {
    const { data, cached } = await getOrSet(cacheKey, 6 * 60 * 60, async (): Promise<AnimeInfoResponse> => {
      const gql = `query ($id:Int!){
        Media(id:$id, type: ANIME){
          id
          title{ english romaji native userPreferred }
          coverImage{ extraLarge large medium }
          bannerImage
          description(asHtml:false)
          seasonYear
          genres
          status
          trailer { id site thumbnail }
          tags { name }
          recommendations(page:1, perPage:10){
            nodes { mediaRecommendation { id title{english romaji native} coverImage{extraLarge large medium} seasonYear format } }
          }
          relations { edges { relationType node { id title{english romaji native} coverImage{extraLarge large medium} seasonYear format type } } }
          characters(sort: ROLE, page:1, perPage:10){ edges { role node { id name{full native} image{large medium} } } }
          staff(sort: RELEVANCE, page:1, perPage:10){ edges { role node { id name{ full } image{ large } } } }
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
          body: JSON.stringify({ query: gql, variables: { id: Number(id) } }),
          timeoutMs: 10_000,
        },
        1
      );

      if (res.status === 404) {
        // Map AniList 404 to our 404 response
        throw Object.assign(new Error("Not found"), { code: "NOT_FOUND", status: 404 });
      }
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
      const media = ((root.data as any)?.Media ?? null) as Record<string, unknown> | null;
      if (!media) {
        throw Object.assign(new Error("Not found"), { code: "NOT_FOUND", status: 404 });
      }

      const titleNode = (media.title ?? {}) as Record<string, unknown>;
      const title = String(titleNode.english ?? titleNode.romaji ?? titleNode.native ?? titleNode.userPreferred ?? "Untitled");
      const coverNode = (media.coverImage ?? {}) as Record<string, unknown>;
      const cover = [coverNode.extraLarge, coverNode.large, coverNode.medium].find((v) => typeof v === "string") as string | undefined;
      const banner = typeof media.bannerImage === "string" ? (media.bannerImage as string) : undefined;
      const synopsis = typeof media.description === "string" ? (media.description as string) : undefined;
      const yearNum = Number(media.seasonYear);
      const year = Number.isFinite(yearNum) && yearNum > 0 ? yearNum : undefined;
      const genres = Array.isArray(media.genres) ? (media.genres as unknown[]).map((g) => String(g)) : undefined;
      const status = typeof media.status === "string" ? (media.status as string) : undefined;

      const anime: AnimeMeta = {
        id: String(media.id ?? id),
        title,
        cover,
        banner,
        synopsis,
        year,
        genres,
        status,
      };

      // Drop Consumet integration: return no episodes (AniList does not provide streamable episode IDs)
      const episodes: { id: string; number?: number; title?: string; season?: number | null; airDate?: string | null; durationSec?: number | null }[] = [];

      // Map additional AniList fields for richer detail pages
      const recNodes = (((media as any).recommendations?.nodes) ?? []) as any[];
      const recommendations = recNodes.map((n) => n?.mediaRecommendation).filter(Boolean).map((m: any) => ({
        id: String(m.id),
        title: String(m.title?.english ?? m.title?.romaji ?? m.title?.native ?? "Untitled"),
        cover: [m.coverImage?.extraLarge, m.coverImage?.large, m.coverImage?.medium].find((v: any) => typeof v === "string") as string | undefined,
        year: Number.isFinite(Number(m.seasonYear)) ? Number(m.seasonYear) : undefined,
        type: typeof m.format === "string" ? m.format : undefined,
      }));

      const relEdges = (((media as any).relations?.edges) ?? []) as any[];
      const relations = relEdges.map((e) => e?.node).filter(Boolean).map((m: any) => ({
        id: String(m.id),
        title: String(m.title?.english ?? m.title?.romaji ?? m.title?.native ?? "Untitled"),
        cover: [m.coverImage?.extraLarge, m.coverImage?.large, m.coverImage?.medium].find((v: any) => typeof v === "string") as string | undefined,
        year: Number.isFinite(Number(m.seasonYear)) ? Number(m.seasonYear) : undefined,
        type: typeof m.format === "string" ? m.format : undefined,
      }));

      const charEdges = (((media as any).characters?.edges) ?? []) as any[];
      const characters = charEdges.map((e) => ({
        id: String(e?.node?.id ?? ""),
        name: String(e?.node?.name?.full ?? e?.node?.name?.native ?? ""),
        image: typeof e?.node?.image?.large === "string" ? e.node.image.large : (typeof e?.node?.image?.medium === "string" ? e.node.image.medium : undefined),
        role: typeof e?.role === "string" ? e.role : undefined,
      })).filter((c) => c.id);

      const staffEdges = (((media as any).staff?.edges) ?? []) as any[];
      const staff = staffEdges.map((e) => ({
        id: String(e?.node?.id ?? ""),
        name: String(e?.node?.name?.full ?? ""),
        image: typeof e?.node?.image?.large === "string" ? e.node.image.large : undefined,
        role: typeof e?.role === "string" ? e.role : undefined,
      })).filter((s) => s.id);

      const trailerRaw = (media as any)?.trailer;
      const trailer = trailerRaw ? { id: trailerRaw.id as string | undefined, site: trailerRaw.site as string | undefined, thumbnail: trailerRaw.thumbnail as string | undefined } : null;

      const tags = Array.isArray((media as any)?.tags) ? ((media as any).tags as any[]).map((t) => String(t?.name ?? "")).filter(Boolean) : undefined;

      return { anime, episodes, recommendations, relations, characters, staff, trailer, tags };
    });
    const resp = NextResponse.json(data, { status: 200 });
    resp.headers.set("X-Cache", cached ? "HIT" : "MISS");
    return resp;
  } catch (e: unknown) {
    const hasStatusOrCode = (x: unknown): x is { status?: number; code?: string } =>
      typeof x === "object" && x !== null && ("status" in x || "code" in x);

    if (hasStatusOrCode(e) && (e.status === 404 || e.code === "NOT_FOUND")) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Anime not found" } }, { status: 404 });
    }
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: { code: "UPSTREAM_ERROR", message } }, { status: 502 });
  }
}

