"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useGsapContext } from "@/lib/gsap";
import Card from "@/components/Card";
import { HeroRotator } from "./components/hero/HeroRotator";
import type { AnimeItem } from "./components/hero/types";
import { useMemo } from "react";

function Row({ title, href, items, prioritizeFirstImage = false }: { title: string; href: string; items: any[]; prioritizeFirstImage?: boolean }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm underline">See all</Link>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-3 min-w-max pr-2">
          {items.map((it, i) => (
            <div key={it.id} className="w-40 shrink-0">
              <Card item={it} priority={prioritizeFirstImage && i === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const ref = useGsapContext((gsap, el) => {
    const hero = el.querySelector(".hero");
    if (hero) gsap.fromTo(hero, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 });
  });

  const { data: trending } = useQuery({
    queryKey: ["home", "trending"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/list/trending?page=1&limit=12`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();
  const season = month === 12 || month <= 2 ? "WINTER" : month <= 5 ? "SPRING" : month <= 8 ? "SUMMER" : "FALL";

  const { data: seasonal } = useQuery({
    queryKey: ["home", "seasonal", season, year],
    queryFn: async () => {
      const res = await fetch(`/api/v1/list/seasonal?season=${season}&year=${year}&limit=12`);
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: airing } = useQuery({
    queryKey: ["home", "airing"],
    queryFn: async () => {
      const res = await fetch(`/api/v1/list/airing?limit=30`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      // Filter to items airing today
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      const startSec = Math.floor(startOfDay.getTime() / 1000);
      const endSec = Math.floor(endOfDay.getTime() / 1000);
      const todayItems = (json.items || []).filter((it: any) => it.next && it.next.airingAt >= startSec && it.next.airingAt < endSec).slice(0, 12);
      return { items: todayItems };
    },
    staleTime: 60 * 1000,
  });

  const heroItems: AnimeItem[] = useMemo(() => {
    const src = Array.isArray(trending?.items) ? trending!.items as any[] : [];
    return src
      .filter((it) => !!it.cover)
      .slice(0, 6)
      .map((it) => ({
        id: String(it.id),
        title: String(it.title ?? ""),
        coverUrl: String(it.cover),
        durationMs: 24 * 60 * 1000,
      }));
  }, [trending]);

  return (
    <div ref={ref} className="space-y-8">
      {heroItems.length > 0 ? (
        <HeroRotator
          items={heroItems}
          intervalMs={7000}
          onResume={(id) => { /* hook up to player resume here */ }}
          onStart={(id) => { /* start from 0 */ }}
          onWatchTrailer={(id) => { /* open trailer modal */ }}
          onMarkWatched={(id) => { /* mark watched in store/db */ }}
        />
      ) : null}

      <section className="hero rounded-lg border p-6 md:p-10 bg-gradient-to-br from-slate-100 to-white dark:from-slate-900 dark:to-slate-950">
        <h1 className="text-3xl font-bold">Welcome to animex</h1>
        <p className="opacity-80 mt-2">Browse anime via AniList. Try Trending, Seasonal, and Airing now.</p>
      </section>

      {trending?.items?.length ? <Row title="Trending now" href="/trending" items={trending.items} prioritizeFirstImage /> : null}
      {seasonal?.items?.length ? <Row title={`This season (${season} ${year})`} href={`/season?season=${season}&year=${year}`} items={seasonal.items} /> : null}
      {airing?.items?.length ? <Row title="Airing today" href="/airing" items={airing.items} /> : null}
    </div>
  );
}
