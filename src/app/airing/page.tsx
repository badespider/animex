"use client";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Pagination from "@/components/Pagination";
import Chip from "@/components/ui/Chip";

const LIMIT = 50;

function fmtLocal(sec?: number) {
  if (!sec) return "";
  try { return new Date(sec * 1000).toLocaleString(); } catch { return String(sec); }
}

export default function AiringPage() {
  const router = useRouter();
  const search = useSearchParams();
  const page = Math.max(1, Number(search?.get("page") ?? 1) || 1);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["list", "airing", page],
    queryFn: async () => {
      const res = await fetch(`/api/v1/list/airing?page=${page}&limit=${LIMIT}`);
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ items: any[]; page: number; total: number }>;
    },
    staleTime: 60 * 1000,
    retry: 1,
  });

  const onChange = (next: number) => {
    if (next < 1) return;
    const params = new URLSearchParams(search?.toString() ?? "");
    params.set("page", String(next));
    router.push(`/airing?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Airing (next 7 days)</h1>
      {/* Filter summary (static for now) */}
      <div className="flex items-center gap-2 flex-wrap">
        <Chip as="span" variant="outline">Next 7 days</Chip>
      </div>
      <div className="sr-only" aria-live="polite">Filters updated: Next 7 days</div>
      {isError ? (
        <div role="alert" className="text-red-600">{String(error)}</div>
      ) : isLoading ? (
        <div role="status" aria-busy="true" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {new Array(10).fill(0).map((_, i) => (
            <div key={i} className="border rounded p-2 animate-pulse">
              <div className="aspect-[2/3] mb-2 bg-black/5 dark:bg-white/10 rounded" />
              <div className="h-4 bg-black/5 dark:bg-white/10 rounded w-3/4 mb-1" />
              <div className="h-3 bg-black/5 dark:bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {data?.items?.map((it: any) => (
            <div key={it.id} className="border rounded p-2">
              <div className="aspect-[2/3] relative mb-2 bg-black/5 dark:bg-white/10">
                {it.cover ? <Image src={it.cover} alt={it.title} fill sizes="(min-width:1024px) 18vw, (min-width:640px) 28vw, 45vw" className="object-cover rounded" /> : null}
              </div>
              <div className="text-sm font-medium line-clamp-2">{it.title}</div>
              <div className="text-xs opacity-70 mb-1">{[it.type, it.year].filter(Boolean).join(" • ")}</div>
              {it.next ? (
                <div className="text-xs">
                  Next: Ep {it.next.episode} — {fmtLocal(it.next.airingAt)}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} total={data?.total} limit={LIMIT} onChange={onChange} />
    </div>
  );
}

