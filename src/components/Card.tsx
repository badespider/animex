"use client";
import Link from "next/link";
import Image from "next/image";
import FavoriteButton from "@/components/FavoriteButton";
import Chip from "@/components/ui/Chip";
import { useFavorites } from "@/store/favorites";

export type CardItem = { id: string; title: string; cover?: string; year?: number; type?: string };

export default function Card({ item, className = "", priority = false }: { item: CardItem; className?: string; priority?: boolean }) {
  return (
    <Link
      href={`/anime/${encodeURIComponent(item.id)}`}
      className={`group border rounded p-2 block focus-visible:ring-2 focus-visible:ring-blue-500 outline-none transition-shadow ${className}`}
      aria-label={`View details for ${item.title}`}
    >
<div className="aspect-[2/3] relative mb-2 bg-black/5 dark:bg-white/10 rounded overflow-hidden transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-focus-within:-translate-y-0.5">
        {item.cover ? (
          <Image
            src={item.cover}
            alt={item.title}
            fill
            sizes="(min-width:1024px) 18vw, (min-width:640px) 28vw, 45vw"
            className="object-cover"
            placeholder="empty"
            priority={priority}
          />
        ) : null}
        <div className="absolute top-1 right-1">
          <FavoriteButton item={{ id: item.id, title: item.title, cover: item.cover, year: item.year, type: item.type }} />
        </div>
        {useFavorites((s) => s.has(item.id)) ? (
          <div className="absolute bottom-1 left-1">
            <Chip variant="info" size="sm">Favorited</Chip>
          </div>
        ) : null}
      </div>
      <div className="text-sm font-medium line-clamp-2">{item.title}</div>
      <div className="text-xs opacity-70">{[item.type, item.year].filter(Boolean).join(" • ")}</div>
    </Link>
  );
}

