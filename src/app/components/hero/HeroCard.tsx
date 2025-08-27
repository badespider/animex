'use client';
import Image from 'next/image';
import React from 'react';
import { ProgressBar } from './ProgressBar';
import { AnimeItem } from './types';

function msToTime(ms: number | undefined) {
  if (!ms || ms <= 0) return '0m';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export interface HeroCardProps {
  item: AnimeItem;
  onResume: (id: string) => void;
  onStart: (id: string) => void;
  onWatchTrailer: (id: string) => void;
  onMarkWatched: (id: string) => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ item, onResume, onStart, onWatchTrailer, onMarkWatched }) => {
  const hasProgress = typeof item.progressMs === 'number' && (item.progressMs ?? 0) > 0;
  const canResume = hasProgress && (item.progressMs as number) < item.durationMs;

  return (
    <section
      className="relative rounded-lg overflow-hidden border bg-black/5 min-h-[300px] md:min-h-[440px]"
      role="region"
      aria-label={`Featured: ${item.title}`}
    >
      <Image
        src={item.coverUrl}
        alt={item.title}
        fill
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      <div className="relative z-10 p-6 md:p-10 flex flex-col justify-end h-full">
        <h2 className="text-white text-2xl md:text-4xl font-semibold tracking-wide drop-shadow-md uppercase">
          {item.title}
        </h2>

        <div className="mt-3 text-white/80 text-sm">
          <span>{msToTime(item.progressMs)} / {msToTime(item.durationMs)}</span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {canResume ? (
            <button
              onClick={() => onResume(item.id)}
              className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition"
              aria-label={`Resume ${item.title}`}
              title="Resume"
            >
              Resume
            </button>
          ) : (
            <button
              onClick={() => onWatchTrailer(item.id)}
              className="inline-flex items-center justify-center rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition"
              aria-label={`Watch trailer for ${item.title}`}
              title="Watch Trailer"
            >
              Watch Trailer
            </button>
          )}

          <button
            onClick={() => onMarkWatched(item.id)}
            className="inline-flex items-center justify-center rounded-full border border-white/40 text-white px-4 py-2 font-medium hover:bg-white/10 transition"
            aria-label={`Mark ${item.title} as watched`}
            title="Mark as Watched"
          >
            Mark as Watched
          </button>
        </div>

        {hasProgress && (
          <ProgressBar value={item.progressMs as number} max={item.durationMs} />
        )}
      </div>
    </section>
  );
};

