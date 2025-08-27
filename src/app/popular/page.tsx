"use client";
import React, { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import SearchResults from "@/components/search/SearchResults";
import Pagination from "@/components/Pagination";
import Chip from "@/components/ui/Chip";
import FilterPill from "@/components/ui/FilterPill";

const LIMIT = 20;
const STATUSES = ["RELEASING", "FINISHED", "NOT_YET_RELEASED"] as const;
const SORTS = ["TRENDING", "POPULARITY", "SCORE"] as const;
const DEFAULT_SORT = "POPULARITY" as const;

function PopularContent() {
  const router = useRouter();
  const search = useSearchParams();
  const page = Math.max(1, Number(search?.get("page") ?? 1) || 1);
  const [sort, setSort] = React.useState<string>(search?.get("sort") || DEFAULT_SORT);
  const [status, setStatus] = React.useState<string[]>(((search?.get("status") ?? "").split(",").map(s=>s.trim()).filter(Boolean)) || []);

  React.useEffect(() => {
    const params = new URLSearchParams(search?.toString() ?? "");
    if (sort) params.set("sort", sort); else params.delete("sort");
    if (status.length) params.set("status", status.join(",")); else params.delete("status");
    // Reset pagination when filters change
    params.set("page", "1");
    router.replace(`/popular?${params.toString()}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, status]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["list", "popular", page, sort, status.join(",")],
    queryFn: async () => {
      const sParam = sort ? `&sort=${encodeURIComponent(sort)}` : "";
      const stParam = status.length ? `&status=${encodeURIComponent(status.join(","))}` : "";
      const res = await fetch(`/api/v1/list/popular?page=${page}&limit=${LIMIT}${sParam}${stParam}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ items: any[]; page: number; total: number }>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const onChange = (next: number) => {
    if (next < 1) return;
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("page", String(next));
    if (sort) params.set("sort", sort);
    if (status.length) params.set("status", status.join(",")); else params.delete("status");
    router.push(`/popular?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Popular</h1>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-sm">
          <div className="font-medium mb-1">Sort</div>
          <div className="flex items-center gap-2" role="radiogroup" aria-label="Sort">
            {SORTS.map((s) => {
              const selected = sort === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSort(s)}
                  className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full"
                  title={`Sort by ${s}`}
                >
                  <Chip as="span" ariaPressed={selected} variant={selected ? "default" : "outline"}>{s}</Chip>
                </button>
              );
            })}
          </div>
        </div>
        <fieldset className="text-sm">
          <legend className="font-medium">Status</legend>
          <div className="flex gap-2 flex-wrap">
            {STATUSES.map(s => {
              const selected = status.includes(s);
              return (
                <FilterPill key={s} label={s} selected={selected} onToggle={(next) => setStatus(prev => next ? Array.from(new Set([...prev, s])) : prev.filter(x=>x!==s))} />
              );
            })}
          </div>
        </fieldset>
      </div>
      {/* Active filters summary */}
      <div className="flex items-center gap-2 flex-wrap">
        {sort !== DEFAULT_SORT ? (
          <Chip as="span" variant="outline">
            Sort: {sort}
            <button className="ml-2" aria-label="Reset sort" onClick={() => setSort(DEFAULT_SORT)}>×</button>
          </Chip>
        ) : null}
        {status.map((s) => (
          <Chip key={s} as="span" variant="outline">
            {s}
            <button className="ml-2" aria-label={`Remove ${s} filter`} onClick={() => setStatus(prev => prev.filter(x => x !== s))}>×</button>
          </Chip>
        ))}
        {(sort !== DEFAULT_SORT || status.length > 0) ? (
          <button className="ml-auto text-sm underline" onClick={() => { setSort(DEFAULT_SORT); setStatus([]); }}>Clear all</button>
        ) : null}
      </div>
      <div className="sr-only" aria-live="polite">Filters updated: sort {sort}{status.length ? ", status " + status.join(", ") : ""}</div>
      <SearchResults items={data?.items ?? []} loading={isLoading} error={isError ? String(error) : undefined} />
      <Pagination page={page} total={data?.total} limit={LIMIT} onChange={onChange} />
    </div>
  );
}

export default function PopularPage() {
  return (
    <Suspense fallback={<div className="space-y-4" aria-busy>Loading…</div>}>
      <PopularContent />
    </Suspense>
  );
}

