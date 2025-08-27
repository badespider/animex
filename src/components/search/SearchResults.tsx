"use client";
import { useEffect, useRef, useState } from "react";
import Card from "@/components/Card";

type Item = { id: string; title: string; cover?: string; year?: number; type?: string };

export default function SearchResults({ items, loading, error }: { items: Item[]; loading: boolean; error?: string }) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!listRef.current) return;
      if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, items.length - 1));
      if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  if (error) return <div role="alert" className="text-red-600">Error: {error}</div>;
  if (loading) {
    const skeletons = new Array(10).fill(0);
    return (
      <div role="status" aria-busy="true" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {skeletons.map((_, i) => (
          <div key={i} className="border rounded p-2 animate-pulse">
            <div className="aspect-[2/3] mb-2 bg-black/5 dark:bg-white/10 rounded" />
            <div className="h-4 bg-black/5 dark:bg-white/10 rounded w-3/4 mb-1" />
            <div className="h-3 bg-black/5 dark:bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }
  if (!items?.length) return <div>No results.</div>;

  return (
    <>
      <div className="sr-only" aria-live="polite">Showing {items.length} results</div>
      <div ref={listRef} role="listbox" aria-label="Search results" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {items.map((it, i) => (
          <div key={it.id} tabIndex={0} onFocus={() => setActive(i)} className={`${i === active ? "ring-2 ring-blue-500 rounded" : ""}`}>
            <Card item={it} />
          </div>
        ))}
      </div>
    </>
  );
}
