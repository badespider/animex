"use client";
import React, { useMemo, useRef, useState } from "react";
import SearchResults from "@/components/search/SearchResults";
import { useFavorites, FavItem } from "@/store/favorites";
import Chip from "@/components/ui/Chip";

type SortKey = "date" | "title" | "year";

export default function FavoritesPage() {
  const itemsMap = useFavorites((s) => s.items);
  const clear = useFavorites((s) => s.clear);
  const importFrom = useFavorites((s) => s.importFrom);
  const exportList = useFavorites((s) => s.exportList);
  const fileRef = useRef<HTMLInputElement>(null);
  const [sort, setSort] = useState<SortKey>("date");

  const items = useMemo(() => {
    const arr = Object.values(itemsMap);
    switch (sort) {
      case "title":
        return arr.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
      case "year":
        return arr.sort((a, b) => (b.year || 0) - (a.year || 0));
      case "date":
      default:
        return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
    }
  }, [itemsMap, sort]);

  const onExport = () => {
    const data = exportList();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "favorites.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt) as FavItem[];
      if (!Array.isArray(parsed)) throw new Error("Invalid file");
      importFrom(parsed);
    } catch (e) {
      alert(`Import failed: ${e}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold mr-auto">Favorites</h1>
        <label className="text-sm">Sort by
          <select className="ml-2 border rounded px-2 py-1" value={sort} onChange={(e)=> setSort(e.target.value as SortKey)}>
            <option value="date">Date added</option>
            <option value="title">Title A–Z</option>
            <option value="year">Year (desc)</option>
          </select>
        </label>
        <button className="border rounded px-2 py-1 text-sm" onClick={() => clear()} title="Clear all">
          Clear all
        </button>
        <button className="border rounded px-2 py-1 text-sm" onClick={onExport} title="Export as JSON">
          Export
        </button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); e.currentTarget.value = ""; }} />
        <button className="border rounded px-2 py-1 text-sm" onClick={() => fileRef.current?.click()} title="Import from JSON">
          Import
        </button>
      </div>
      {items.length === 0 ? (
        <div className="opacity-70">
          No favorites yet. Browse anime and click the <Chip as="span" variant="danger">♥</Chip> button on a card to add it here.
        </div>
      ) : (
        <SearchResults items={items} loading={false} error={undefined} />
      )}
    </div>
  );
}

