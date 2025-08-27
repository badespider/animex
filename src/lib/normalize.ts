export type SearchItem = { id: string; title: string; cover?: string; year?: number; type?: string };
export type SearchResponse = { items: SearchItem[]; page: number; total: number };

export function normalizeConsumetSearch(json: unknown): SearchResponse {
  const obj = (json ?? {}) as Record<string, unknown>;
  const resultsRaw: unknown[] = Array.isArray((obj as { results?: unknown }).results)
    ? ((obj as { results?: unknown }).results as unknown[])
    : Array.isArray((obj as { data?: unknown }).data)
    ? ((obj as { data?: unknown }).data as unknown[])
    : [];

  const items: SearchItem[] = resultsRaw.map((x) => {
    const rec = (x ?? {}) as Record<string, unknown>;
    const id = rec.id ?? rec.malId ?? rec._id ?? "";

    const titleField = rec.title;
    let title = "Untitled";
    if (typeof titleField === "string") {
      title = titleField;
    } else if (titleField && typeof titleField === "object") {
      const t = titleField as Record<string, unknown>;
      title = String(t.english ?? t.romaji ?? t.native ?? "Untitled");
    }

    const cover = [rec.image, rec.cover, rec.poster, rec.posterImage].find((v) => typeof v === "string") as string | undefined;

    const yearCandidates = [
      rec.releaseDate,
      rec.year,
      (rec.startDate as Record<string, unknown> | undefined)?.year,
      rec.seasonYear,
    ];
    const year = yearCandidates
      .map((v) => Number(v))
      .find((n) => Number.isFinite(n) && n > 0) ?? undefined;

    const type = [rec.type, rec.format, rec.kind].find((v) => typeof v === "string") as string | undefined;

    return { id: String(id), title, cover, year, type };
  });

  const page = Number((obj as Record<string, unknown>).currentPage ?? (obj as Record<string, unknown>).page ?? 1) || 1;
  const total = Number((obj as Record<string, unknown>).total ?? items.length) || items.length;
  return { items, page, total };
}

// ----- Anime info normalization -----
export type AnimeMeta = {
  id: string;
  title: string;
  cover?: string;
  banner?: string;
  synopsis?: string;
  year?: number;
  genres?: string[];
  status?: string;
};

export type EpisodeItem = {
  id: string; // episode id used for streaming
  number?: number;
  title?: string;
  season?: number | null;
  airDate?: string | null;
  durationSec?: number | null;
};

export type MiniAnimeItem = { id: string; title: string; cover?: string; year?: number; type?: string };
export type CharacterItem = { id: string; name: string; image?: string; role?: string };
export type StaffItem = { id: string; name: string; image?: string; role?: string };
export type Trailer = { site?: string; id?: string; thumbnail?: string } | null;

export type AnimeInfoResponse = {
  anime: AnimeMeta;
  episodes: EpisodeItem[];
  recommendations?: MiniAnimeItem[];
  relations?: MiniAnimeItem[];
  characters?: CharacterItem[];
  staff?: StaffItem[];
  trailer?: Trailer;
  tags?: string[];
};

export function normalizeConsumetAnimeInfo(json: unknown): AnimeInfoResponse {
  const obj = (json ?? {}) as Record<string, unknown>;

  // id
  const id = String((obj.id as string | undefined) ?? (obj.anilistId as string | number | undefined) ?? "");

  // title
  const titleField = (obj.title ?? {}) as Record<string, unknown> | string | undefined;
  let title = "Untitled";
  if (typeof titleField === "string") title = titleField;
  else if (titleField && typeof titleField === "object") {
    const t = titleField as Record<string, unknown>;
    title = String(t.english ?? t.romaji ?? t.native ?? t.userPreferred ?? "Untitled");
  }

  const cover = [obj.image, obj.cover, obj.poster, obj.posterImage].find((v) => typeof v === "string") as string | undefined;
  const banner = [obj.cover, obj.bannerImage, obj.banner].find((v) => typeof v === "string") as string | undefined;
  const synopsis = typeof obj.description === "string" ? obj.description : (typeof obj.synopsis === "string" ? obj.synopsis : undefined);

  const yearCandidates = [
    (obj.startDate as Record<string, unknown> | undefined)?.year,
    obj.releaseDate,
    obj.year,
    obj.seasonYear,
  ];
  const year = yearCandidates.map((v) => Number(v)).find((n) => Number.isFinite(n) && n > 0) ?? undefined;

  const genres = Array.isArray(obj.genres) ? (obj.genres as unknown[]).map((g) => String(g)) : undefined;
  const status = typeof obj.status === "string" ? obj.status : undefined;

  const episodesRaw = Array.isArray((obj as { episodes?: unknown[] }).episodes)
    ? (((obj as { episodes?: unknown[] }).episodes as unknown[]) ?? [])
    : [];

  const episodes: EpisodeItem[] = episodesRaw.map((e) => {
    const rec = (e ?? {}) as Record<string, unknown>;
    const eid = rec.id ?? rec.episodeId ?? rec.sourceId ?? rec._id ?? "";
    const num = rec.number ?? rec.episode ?? rec.ep;
    const sea = rec.season ?? null;
    const air = rec.airDate ?? rec.aired ?? null;
    const dur = rec.duration ?? rec.durationSec ?? null;
    return {
      id: String(eid),
      number: typeof num === "number" ? num : Number(num) || undefined,
      title: typeof rec.title === "string" ? rec.title : undefined,
      season: typeof sea === "number" ? sea : sea == null ? null : Number(sea) || null,
      airDate: air ? String(air) : null,
      durationSec: typeof dur === "number" ? dur : dur == null ? null : Number(dur) || null,
    };
  });

  return {
    anime: { id, title, cover, banner, synopsis, year, genres, status },
    episodes,
  };
}
