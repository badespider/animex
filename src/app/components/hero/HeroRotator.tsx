'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeroCard } from './HeroCard';
import { AnimeItem } from './types';

export interface HeroRotatorProps {
  items: AnimeItem[];
  intervalMs?: number;
  onResume: (id: string) => void;
  onStart: (id: string) => void;
  onWatchTrailer: (id: string) => void;
  onMarkWatched: (id: string) => void;
}

export const HeroRotator: React.FC<HeroRotatorProps> = ({
  items,
  intervalMs = 7000,
  onResume,
  onStart,
  onWatchTrailer,
  onMarkWatched,
}) => {
  const [index, setIndex] = useState(0);
  const hovering = useRef(false);
  const paused = useRef(false);

  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerTitle, setTrailerTitle] = useState<string>('');
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [trailerError, setTrailerError] = useState<string | null>(null);

  const count = items.length;
  const current = items[index] as AnimeItem | undefined;

  // Preload next image
  const nextCover = useMemo(() => {
    if (count < 2) return null;
    const next = items[(index + 1) % count];
    return next?.coverUrl ?? null;
  }, [index, items, count]);

  useEffect(() => {
    if (!nextCover) return;
    const img = new Image();
    img.src = nextCover;
  }, [nextCover]);

  // Auto-advance with pause behaviors
  useEffect(() => {
    if (count < 2) return;
    let timer: number | undefined;

    function tick() {
      setIndex((i) => (i + 1) % count);
    }

    function start() {
      if (!hovering.current && !paused.current && typeof window !== 'undefined' && document.visibilityState === 'visible') {
        timer = window.setInterval(tick, intervalMs);
      }
    }
    function stop() {
      if (timer) window.clearInterval(timer);
      timer = undefined;
    }

    start();
    const onVis = () => (document.visibilityState === 'visible' ? start() : stop());
    document.addEventListener('visibilitychange', onVis);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [count, intervalMs]);

  // ESC closes trailer overlay
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setTrailerOpen(false);
        paused.current = false;
      }
    }
    if (trailerOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [trailerOpen]);

  async function openTrailer(id: string, title?: string, knownUrl?: string | undefined) {
    paused.current = true;
    setTrailerTitle(title || 'Trailer');
    setTrailerError(null);
    setTrailerLoading(true);
    setTrailerOpen(true);

    try {
      // If caller provided a direct URL, use it
      if (knownUrl) {
        setTrailerUrl(knownUrl);
        return;
      }
      // Fetch details to get trailer info
      const res = await fetch(`/api/v1/anime/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load trailer (${res.status})`);
      const data = await res.json();
      const site: string | undefined = data?.trailer?.site;
      const vid: string | undefined = data?.trailer?.id;
      if (site === 'youtube' && vid) {
        setTrailerUrl(`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1`);
      } else {
        setTrailerUrl(null);
        setTrailerError('Trailer not available');
      }
    } catch (e: any) {
      setTrailerError(e?.message || 'Failed to load trailer');
      setTrailerUrl(null);
    } finally {
      setTrailerLoading(false);
    }
  }

  if (count === 0) {
    return (
      <div className="rounded-lg border min-h-[320px] md:min-h-[400px] bg-muted/10 animate-pulse" aria-label="Loading featured content" />
    );
  }

  const goPrev = () => setIndex((i) => (i - 1 + count) % count);
  const goNext = () => setIndex((i) => (i + 1) % count);

  return (
    <div
      className="relative"
      onMouseEnter={() => { hovering.current = true; }}
      onMouseLeave={() => { hovering.current = false; }}
    >
      {/* Slide container with fade transition */}
      <div className="relative">
        <HeroCard
          key={current?.id}
          item={current!}
          onResume={onResume}
          onStart={onStart}
          onWatchTrailer={(id) => { onWatchTrailer(id); openTrailer(id, current?.title, current?.trailerUrl); }}
          onMarkWatched={onMarkWatched}
        />
        {/* Simple fade-in effect */}
        <div
          key={`fade-${current?.id}`}
          className="pointer-events-none absolute inset-0 bg-black/0 animate-[fadeIn_400ms_ease]"
          aria-hidden="true"
        />
      </div>

      {/* Controls */}
      {count > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-3 md:p-2 hover:bg-black/60"
            aria-label="Previous"
            title="Previous"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-3 md:p-2 hover:bg-black/60"
            aria-label="Next"
            title="Next"
          >
            ›
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
            {items.map((it, i) => {
              const active = i === index;
              return (
                <button
                  key={it.id}
                  onClick={() => setIndex(i)}
                  className={`${active ? 'bg-white' : 'bg-white/40 hover:bg-white/60'} rounded-full h-3 w-3 md:h-2.5 md:w-2.5`}
                  aria-label={`Show ${it.title}`}
                  aria-current={active ? 'true' : undefined}
                  title={it.title}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Trailer overlay */}
      {trailerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={`Trailer: ${trailerTitle}`} onClick={(e) => { if (e.target === e.currentTarget) { setTrailerOpen(false); paused.current = false; } }}>
          <div className="w-full max-w-5xl">
            <div className="relative aspect-video rounded-lg overflow-hidden border bg-black">
              {trailerLoading ? (
                <div className="absolute inset-0 grid place-items-center text-white/90">Loading trailer…</div>
              ) : trailerUrl ? (
                <iframe
                  title="Trailer"
                  src={trailerUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-white/90">
                  {trailerError || 'Trailer not available'}
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => { setTrailerOpen(false); paused.current = false; }}
                className="px-4 py-2 rounded border border-white/30 text-white hover:bg-white/10"
                aria-label="Close trailer"
                title="Close"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

