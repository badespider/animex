"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SearchBar from "@/components/search/SearchBar";
import SearchResults from "@/components/search/SearchResults";
import Pagination from "@/components/Pagination";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import type { SearchItem } from "@/lib/normalize";

type APIResponse = { items: SearchItem[]; page: number; total: number };
const LIMIT = 20;

export default function SearchPage() {
  const router = useRouter();
  const search = useSearchParams();
  const initialQ = search?.get("q") ?? "";
  const initialPage = Math.max(1, Number(search?.get("page") ?? 1) || 1);

  const [q, setQ] = useState(initialQ);
  const debounced = useDebouncedValue(q, 500);
  const enabled = debounced.trim().length > 0;
  const page = enabled ? initialPage : 1;

  useEffect(() => {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (q.trim()) params.set("q", q.trim()); else params.delete("q");
    params.set("page", String(page));
    router.replace(`/search?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["search", debounced, page],
    queryFn: async (): Promise<APIResponse> => {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(debounced)}&page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const onChange = (next: number) => {
    if (next < 1) return;
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("page", String(next));
    router.push(`/search?${params.toString()}`);
  };

  const suggestions = [
    "One Piece", "Naruto", "Demon Slayer", "Jujutsu Kaisen", "Attack on Titan", "Spy x Family"
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchBar value={q} onChange={(v) => { setQ(v); }} />
      {/* Active query */}
      {q.trim() ? (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm">Filters:</span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
            “{q.trim()}”
            <button className="ml-1" aria-label="Clear query" onClick={() => setQ("")}>×</button>
          </span>
          <button className="ml-auto text-sm underline" onClick={() => setQ("")}>Clear all</button>
        </div>
      ) : null}
      <div className="sr-only" aria-live="polite">Filters updated: query {q.trim() || "(empty)"}</div>
      <div className="flex items-center gap-2 flex-wrap">
        {suggestions.map((s) => (
          <button key={s} className="text-sm underline" onClick={() => setQ(s)} title={`Search for ${s}`}>
            {s}
          </button>
        ))}
      </div>
      {!enabled ? (
        <div className="opacity-70">Type to search anime.</div>
      ) : (
        <>
          <SearchResults items={data?.items ?? []} loading={isLoading} error={isError ? String(error) : undefined} />
          <Pagination page={page} total={data?.total} limit={LIMIT} onChange={onChange} />
        </>
      )}
    </div>
  );
}
