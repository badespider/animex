import Image from "next/image";
import Link from "next/link";
import type { AnimeInfoResponse } from "@/lib/normalize";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import FavoriteButton from "@/components/FavoriteButton";

async function getAnime(id: string): Promise<AnimeInfoResponse> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;
  const res = await fetch(`${base}/api/v1/anime/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    notFound();
  }
  if (!res.ok) {
    throw new Error(`Failed to load: ${res.status}`);
  }
  return res.json();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? "http";
    const base = `${proto}://${host}`;
    const res = await fetch(`${base}/api/v1/anime/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return { title: "Anime", description: "Anime details" };
    const data = (await res.json()) as AnimeInfoResponse;
    const a = data.anime;
    const title = a.title ? `${a.title} • animex` : "animex";
    const desc = a.synopsis?.slice(0, 160);
    const image = a.banner || a.cover;
    return {
      title,
      description: desc,
      alternates: { canonical: `https://anilist.co/anime/${a.id}` },
      openGraph: {
        title,
        description: desc || undefined,
        images: image ? [{ url: image }] : undefined,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: desc || undefined,
        images: image ? [image] : undefined,
      },
    };
  } catch {
    return { title: "Anime", description: "Anime details" };
  }
}

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAnime(id);
  const a = data.anime;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row gap-4">
        {a.cover ? (
          <div className="relative w-40 h-60 shrink-0 rounded overflow-hidden bg-black/5 dark:bg-white/10">
            <Image src={a.cover} alt={a.title} fill sizes="160px" className="object-cover" />
          </div>
        ) : null}
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <h1 className="text-2xl font-bold flex-1">{a.title}</h1>
            <FavoriteButton item={{ id: a.id, title: a.title, cover: a.cover, year: a.year, type: a.status }} />
            <a href={`https://anilist.co/anime/${a.id}`} target="_blank" rel="noreferrer" className="px-2 py-1 border rounded text-sm">View on AniList</a>
          </div>
          <div className="opacity-70 text-sm mt-1 flex flex-wrap items-center gap-2">
            {a.year ? <span>{a.year}</span> : null}
            {a.status ? <span>• {a.status}</span> : null}
            {a.genres?.length ? <span>• {a.genres.slice(0, 5).join(", ")}</span> : null}
          </div>
          {a.synopsis ? <p className="mt-3 max-w-prose opacity-90 text-sm">{a.synopsis}</p> : null}
          {data.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {data.tags.slice(0, 12).map((t) => (
                <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="text-xs px-2 py-0.5 rounded-full border opacity-80 hover:underline">{t}</Link>
              ))}
            </div>
          ) : null}
        </div>
      </header>

      {data.recommendations?.length ? (
        <section>
          <h2 className="text-xl font-semibold mb-3">Recommendations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {data.recommendations.map((it) => (
              <Link key={it.id} href={`/anime/${encodeURIComponent(it.id)}`} className="border rounded p-2 block">
                <div className="aspect-[2/3] relative mb-2 bg-black/5 dark:bg-white/10">
                  {it.cover ? <Image src={it.cover} alt={it.title} fill sizes="(min-width:1024px) 18vw, (min-width:640px) 28vw, 45vw" className="object-cover rounded" /> : null}
                </div>
                <div className="text-sm font-medium line-clamp-2">{it.title}</div>
                <div className="text-xs opacity-70">{[it.type, it.year].filter(Boolean).join(" • ")}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {data.relations?.length ? (
        <section>
          <h2 className="text-xl font-semibold mb-3">Related</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {data.relations.map((it) => (
              <Link key={it.id} href={`/anime/${encodeURIComponent(it.id)}`} className="border rounded p-2 block">
                <div className="aspect-[2/3] relative mb-2 bg-black/5 dark:bg-white/10">
                  {it.cover ? <Image src={it.cover} alt={it.title} fill sizes="(min-width:1024px) 18vw, (min-width:640px) 28vw, 45vw" className="object-cover rounded" /> : null}
                </div>
                <div className="text-sm font-medium line-clamp-2">{it.title}</div>
                <div className="text-xs opacity-70">{[it.type, it.year].filter(Boolean).join(" • ")}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {data.characters?.length ? (
        <section>
          <h2 className="text-xl font-semibold mb-3">Characters</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {data.characters.map((c) => (
              <li key={c.id} className="border rounded p-2">
                <div className="aspect-square relative mb-2 bg-black/5 dark:bg-white/10">
                  {c.image ? <Image src={c.image} alt={c.name} fill sizes="160px" className="object-cover rounded" /> : null}
                </div>
                <div className="text-sm font-medium line-clamp-2">{c.name}</div>
                {c.role ? <div className="text-xs opacity-70">{c.role}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.staff?.length ? (
        <section>
          <h2 className="text-xl font-semibold mb-3">Staff</h2>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {data.staff.map((s, idx) => (
              <li key={`${s.id}-${s.role ?? ""}-${idx}`} className="border rounded p-2">
                <div className="aspect-square relative mb-2 bg-black/5 dark:bg-white/10">
                  {s.image ? <Image src={s.image} alt={s.name} fill sizes="160px" className="object-cover rounded" /> : null}
                </div>
                <div className="text-sm font-medium line-clamp-2">{s.name}</div>
                {s.role ? <div className="text-xs opacity-70">{s.role}</div> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.trailer?.site && data.trailer.id ? (
        <section id="trailer">
          <h2 className="text-xl font-semibold mb-3">Trailer</h2>
          {data.trailer.site === "youtube" ? (
            <div className="aspect-video rounded overflow-hidden border">
              <iframe
                title="Trailer"
                src={`https://www.youtube-nocookie.com/embed/${data.trailer.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="text-sm">
              <a className="underline" href={data.trailer.id ? `https://www.youtube.com/watch?v=${data.trailer.id}` : undefined} target="_blank" rel="noreferrer">
                Open trailer
              </a>
            </div>
          )}
        </section>
      ) : null}

      {/* Episodes remain empty with AniList-only setup */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Episodes</h2>
        {!data.episodes?.length ? (
          <div>No episodes found.</div>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {data.episodes.map((e) => (
              <li key={e.id} className="border rounded p-2">
                <div className="text-sm font-medium">Episode {e.number ?? "?"}</div>
                {e.title ? <div className="text-xs opacity-70 line-clamp-2">{e.title}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

