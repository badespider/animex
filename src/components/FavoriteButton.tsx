"use client";
import { useFavorites, FavItem } from "@/store/favorites";

export default function FavoriteButton({ item, className = "" }: { item: FavItem; className?: string }) {
  const has = useFavorites((s) => s.has(item.id));
  const toggle = useFavorites((s) => s.toggle);
  return (
    <button
      type="button"
      aria-pressed={has}
      title={has ? "Remove from Favorites" : "Add to Favorites"}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item); }}
      className={`rounded px-2 py-1 text-sm border ${has ? "bg-red-500 text-white border-red-500" : "bg-white/80 dark:bg-black/50"} ${className}`}
    >
      {has ? "♥" : "♡"}
    </button>
  );
}

