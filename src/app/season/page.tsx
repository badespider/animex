import type { Metadata } from "next";
import { headers } from "next/headers";
import SeasonClient from "./season-client";

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;

function defaultSeasonYear() {
  const m = new Date().getUTCMonth() + 1;
  const y = new Date().getUTCFullYear();
  if (m === 12 || m <= 2) return { season: "WINTER" as const, year: m === 12 ? y + 1 : y };
  if (m >= 3 && m <= 5) return { season: "SPRING" as const, year: y };
  if (m >= 6 && m <= 8) return { season: "SUMMER" as const, year: y };
  return { season: "FALL" as const, year: y };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  try {
    const sp = await searchParams;
    const def = defaultSeasonYear();
    const season = (sp.season as (typeof SEASONS)[number]) || def.season;
    const year = Number(sp.year ?? def.year);
    const title = `${season} ${year} • animex`;
    const desc = `Browse ${season} ${year} seasonal anime by format and genre.`;
    return { title, description: desc };
  } catch {
    return { title: "Season • animex", description: "Browse seasonal anime" };
  }
}

export default async function SeasonPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const def = defaultSeasonYear();
  const initialSeason = (sp.season as (typeof SEASONS)[number]) || def.season;
  const initialYear = Number(sp.year ?? def.year);
  type Format = "ALL" | "TV" | "TV_SHORT" | "OVA" | "ONA" | "MOVIE" | "SPECIAL" | "MUSIC";
  const ALL_FORMATS: readonly Format[] = ["ALL","TV","TV_SHORT","OVA","ONA","MOVIE","SPECIAL","MUSIC"] as const;
  const fmtParam = sp.format as string | undefined;
  const initialFormat: Format = (fmtParam && (ALL_FORMATS as readonly string[]).includes(fmtParam) ? (fmtParam as Format) : "ALL");
  const initialGenres = (sp.genres ?? "").split(",").map(g => g.trim()).filter(Boolean);
  const initialPage = Math.max(1, Number(sp.page ?? 1) || 1);

  return (
    <SeasonClient
      initialSeason={initialSeason}
      initialYear={initialYear}
      initialFormat={initialFormat}
      initialGenres={initialGenres}
      initialPage={initialPage}
    />
  );
}

