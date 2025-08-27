"use client";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchResults from "@/components/search/SearchResults";
import Pagination from "@/components/Pagination";
import FilterPill from "@/components/ui/FilterPill";
import Chip from "@/components/ui/Chip";

const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
const FORMATS = ["ALL", "TV", "TV_SHORT", "OVA", "ONA", "MOVIE", "SPECIAL", "MUSIC"] as const;
const GENRES = [
  "Action","Adventure","Comedy","Drama","Ecchi","Fantasy","Horror","Mahou Shoujo","Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports","Supernatural","Thriller"
] as const;
const LIMIT = 24;

export default function SeasonClient({
  initialSeason,
  initialYear,
  initialFormat,
  initialGenres,
  initialPage,
}: {
  initialSeason: (typeof SEASONS)[number];
  initialYear: number;
  initialFormat: (typeof FORMATS)[number] | "ALL";
  initialGenres: string[];
  initialPage: number;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [season, setSeason] = useState<(typeof SEASONS)[number]>(initialSeason);
  const [year, setYear] = useState<number>(initialYear);
  const [format, setFormat] = useState<(typeof FORMATS)[number] | "ALL">(initialFormat);
  const [genres, setGenres] = useState<string[]>(initialGenres);
  const page = Math.max(1, Number(search?.get("page") ?? initialPage) || 1);

  useEffect(() => {
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("season", season);
    params.set("year", String(year));
    if (format && format !== "ALL") params.set("format", String(format)); else params.delete("format");
    if (genres.length) params.set("genres", genres.join(",")); else params.delete("genres");
    // Reset pagination to first page when filters change
    params.set("page", "1");
    router.replace(`/season?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, year, format, genres]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["list", "seasonal", season, year, format, genres.join(","), page],
    queryFn: async () => {
      const fmtParam = format && format !== "ALL" ? `&format=${encodeURIComponent(String(format))}` : "";
      const genParam = genres.length ? `&genres=${encodeURIComponent(genres.join(","))}` : "";
      const res = await fetch(`/api/v1/list/seasonal?season=${encodeURIComponent(season)}&year=${year}${fmtParam}${genParam}&page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ items: any[]; page: number; total: number }>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const years = useMemo(() => {
    const now = new Date().getUTCFullYear();
    const arr: number[] = [];
    for (let y = now + 1; y >= now - 10; y--) arr.push(y);
    return arr;
  }, []);

  const onChange = (next: number) => {
    if (next < 1) return;
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("page", String(next));
    router.push(`/season?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Seasonal</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <div className="font-medium mb-1">Season</div>
            <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Season">
              {SEASONS.map((s) => {
                const selected = season === s;
                return (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSeason(s)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                    title={`Season ${s}`}
                  >
                    <Chip as="span" ariaPressed={selected} variant={selected ? "default" : "outline"}>{s}</Chip>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="text-sm">
            <div className="font-medium mb-1">Year</div>
            <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Year">
              {years.map((y) => {
                const selected = year === y;
                return (
                  <button
                    key={y}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setYear(y)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                    title={`Year ${y}`}
                  >
                    <Chip as="span" ariaPressed={selected} variant={selected ? "default" : "outline"}>{y}</Chip>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm">
          <div className="font-medium mb-1">Format</div>
          <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Format">
            {FORMATS.map((f) => {
              const selected = format === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setFormat(f)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                  title={`Format ${f}`}
                >
                  <Chip as="span" ariaPressed={selected} variant={selected ? "default" : "outline"}>{f}</Chip>
                </button>
              );
            })}
          </div>
        </div>
        <fieldset className="text-sm">
          <legend className="font-medium mb-1">Genres</legend>
          <div className="flex items-center gap-2 flex-wrap max-w-3xl">
            {GENRES.map((g) => {
              const selected = genres.includes(g);
              return (
                <FilterPill
                  key={g}
                  label={g}
                  selected={selected}
                  onToggle={(next) => {
                    setGenres((prev) => next ? Array.from(new Set([...prev, g])) : prev.filter(x => x !== g));
                  }}
                />
              );
            })}
          </div>
        </fieldset>
      </div>
      {/* Active filters summary */}
      <div className="flex items-center gap-2 flex-wrap">
        <Chip as="span" variant="outline">{season}</Chip>
        <Chip as="span" variant="outline">{year}</Chip>
        {format !== "ALL" ? (
          <Chip as="span" variant="outline">
            Format: {format}
            <button className="ml-2" aria-label="Reset format" onClick={() => setFormat("ALL")}>×</button>
          </Chip>
        ) : null}
        {genres.map((g) => (
          <Chip key={g} as="span" variant="outline">
            {g}
            <button className="ml-2" aria-label={`Remove ${g}`} onClick={() => setGenres(prev => prev.filter(x => x !== g))}>×</button>
          </Chip>
        ))}
        {(format !== "ALL" || genres.length > 0) ? (
          <button className="ml-auto text-sm underline" onClick={() => { setFormat("ALL"); setGenres([]); }}>Clear all</button>
        ) : null}
      </div>
      <div className="sr-only" aria-live="polite">Filters updated: {season} {year}{format && format !== "ALL" ? ", format " + String(format) : ""}{genres.length ? ", genres " + genres.join(", ") : ""}</div>
      <SearchResults items={data?.items ?? []} loading={isLoading} error={isError ? String(error) : undefined} />
      <Pagination page={page} total={data?.total} limit={LIMIT} onChange={onChange} />
    </div>
  );
}
