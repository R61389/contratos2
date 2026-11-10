import Link from "next/link";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { concertDate, isUpcoming } from "@/lib/concerts";
import type { ConcertView } from "@/lib/data/public-concerts";
import { ConcertPoster, type PosterArtist } from "@/components/concerts/concert-poster";
import { cn } from "@/lib/utils";

export function posterArtist(p: Provider): PosterArtist {
  return { name: p.fullName, photo: p.subject.src || null, cover: p.heroImage, tags: p.tags };
}

export function ConcertCard({ concert, className }: { concert: ConcertView; className?: string }) {
  const d = concertDate(concert.date);
  const past = !isUpcoming(concert);
  return (
    <Link
      href={`/conciertos/${concert.slug}`}
      className={cn(
        "group flex flex-col gap-4 rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-3 transition-colors hover:border-volt/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
        past && "opacity-60 hover:opacity-100",
        className
      )}
    >
      <div className="overflow-hidden rounded-[1.75rem]">
        <ConcertPoster concert={concert} artist={posterArtist(concert.artist)} sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 380px" className="transition-transform duration-700 group-hover:scale-[1.03]" />
      </div>
      <div className="flex items-start justify-between gap-3 px-2 pb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">
            {d.weekday} {d.day} {d.monthShort}
            {past && <span className="ml-2 text-ink-mid">· Finalizado</span>}
          </p>
          <h3 className="mt-1 truncate font-general text-lg font-semibold text-white">{concert.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-mid">
            <Clock className="h-3.5 w-3.5 shrink-0" /> {concert.start} a {concert.end}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink-mid">
            <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{concert.venue}, {concert.city}</span>
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-ink-light transition-colors group-hover:border-volt group-hover:bg-volt group-hover:text-ink">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
