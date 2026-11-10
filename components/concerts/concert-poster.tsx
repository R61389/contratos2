import Image from "next/image";
import { concertDate } from "@/lib/concerts";
import { cn } from "@/lib/utils";

export interface PosterArtist {
  name: string;
  /** Cut-out photo (transparent background) shown in front of the name. */
  photo: string | null;
  /** Background photo, toned down behind everything. */
  cover: string | null;
  tags: string[];
}

export interface PosterConcert {
  title: string;
  date: string;
  start: string;
  end: string;
  venue: string;
  city: string;
  posterUrl: string | null;
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E\")";

/**
 * A concert poster built from the artist's photo and the concert's data, sized with container units so it looks the
 * same in a card, in the panel preview or full size. When the artist uploads their own poster, that image is shown.
 */
export function ConcertPoster({
  concert,
  artist,
  className,
  priority,
  sizes = "(max-width: 768px) 90vw, 480px",
}: {
  concert: PosterConcert;
  artist: PosterArtist;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const frame = cn("relative isolate aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] bg-[#0b0b0b] [container-type:inline-size]", className);

  if (concert.posterUrl) {
    return (
      <div className={frame}>
        <Image src={concert.posterUrl} alt={`Afiche de ${concert.title}`} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  const d = concertDate(concert.date);
  const name = artist.name.toUpperCase();
  // Long names shrink so they always fit on one line.
  const nameSize = `${Math.min(26, 118 / Math.max(name.length, 1)).toFixed(2)}cqw`;
  const genres = artist.tags.slice(0, 3).join("  ·  ");

  return (
    <div className={frame} role="img" aria-label={`Afiche: ${concert.title}, ${d.long}, de ${concert.start} a ${concert.end}, ${concert.venue}, ${concert.city}`}>
      {/* Background: the artist's cover, desaturated and pushed into the dark. */}
      {artist.cover && (
        <Image src={artist.cover} alt="" fill sizes={sizes} priority={priority} className="-z-20 object-cover opacity-40 grayscale" />
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(120%_70%_at_50%_38%,rgba(226,232,0,0.30),transparent_55%),linear-gradient(to_bottom,rgba(11,11,11,0.55),rgba(11,11,11,0.15)_35%,rgba(11,11,11,0.85)_72%,#0b0b0b)]" />
      <div aria-hidden className="absolute left-1/2 top-[34%] -z-10 aspect-square w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-volt/50 shadow-[0_0_80px_rgba(226,232,0,0.35)]" />
      <div aria-hidden className="absolute left-1/2 top-[34%] -z-10 aspect-square w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/15" />

      {/* Header */}
      <div className="absolute inset-x-[6cqw] top-[5.5cqw] flex items-center justify-between">
        <span className="font-display text-[3cqw] font-black tracking-[0.32em] text-white">
          VIB<span className="text-volt">RA</span>
          <span className="ml-[1.5cqw] font-sans text-[2.3cqw] font-medium tracking-[0.3em] text-white/60">PRESENTA</span>
        </span>
        <span className="flex items-center gap-[1.2cqw] rounded-full bg-volt px-[2.6cqw] py-[1cqw] text-[2.3cqw] font-bold tracking-[0.22em] text-ink">
          <span className="h-[1.4cqw] w-[1.4cqw] rounded-full bg-ink" />
          EN VIVO
        </span>
      </div>

      {/* Artist name behind the photo */}
      <p
        aria-hidden
        className="absolute inset-x-0 top-[44%] text-center font-display font-black leading-[0.8] tracking-[-0.04em] text-white [filter:drop-shadow(0_0_30px_rgba(226,232,0,0.35))]"
        style={{ fontSize: nameSize }}
      >
        {name}
      </p>

      {/* Cut-out photo */}
      {artist.photo && (
        <div className="absolute inset-x-0 bottom-[30%] top-[13%]">
          <Image
            src={artist.photo}
            alt=""
            fill
            sizes={sizes}
            priority={priority}
            className="object-contain object-bottom [filter:drop-shadow(0_24px_40px_rgba(0,0,0,0.7))] [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
          />
        </div>
      )}

      {/* Outlined copy of the name over the photo */}
      <p aria-hidden className="text-outline absolute inset-x-0 top-[44%] text-center font-display font-black leading-[0.8] tracking-[-0.04em]" style={{ fontSize: nameSize }}>
        {name}
      </p>

      {/* Billing */}
      <div className="absolute inset-x-[6cqw] bottom-[6cqw]">
        {genres && <p className="mb-[3cqw] text-center text-[2.4cqw] font-semibold uppercase tracking-[0.3em] text-volt">{genres}</p>}
        <div className="flex items-stretch gap-[4cqw] border-t border-white/20 pt-[4cqw]">
          <div className="flex shrink-0 flex-col items-center justify-center rounded-[2.5cqw] bg-volt px-[4cqw] py-[2cqw] text-ink">
            <span className="font-display text-[11cqw] font-black leading-[0.85] tracking-[-0.04em]">{d.day}</span>
            <span className="text-[3cqw] font-bold uppercase tracking-[0.25em]">{d.monthShort}</span>
          </div>
          <div className="flex min-w-0 flex-col justify-center gap-[1.4cqw]">
            <p className="text-[2.6cqw] font-semibold uppercase tracking-[0.28em] text-white/60">
              {d.weekday} · {d.year}
            </p>
            <p className="font-display text-[6.2cqw] font-black leading-none tracking-[-0.02em] text-white">
              {concert.start} <span className="text-volt">—</span> {concert.end}
              <span className="ml-[1.5cqw] text-[2.6cqw] font-semibold tracking-[0.2em] text-white/60">HRS</span>
            </p>
            <p className="line-clamp-2 text-[2.9cqw] font-bold uppercase leading-tight tracking-[0.06em] text-white">{concert.venue}</p>
            <p className="text-[2.6cqw] uppercase tracking-[0.28em] text-white/60">{concert.city} · Bolivia</p>
          </div>
        </div>
      </div>

      {/* Print texture and frame */}
      <div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
      <div aria-hidden className="pointer-events-none absolute inset-[2.5cqw] rounded-[1.25rem] border border-white/10" />
    </div>
  );
}
