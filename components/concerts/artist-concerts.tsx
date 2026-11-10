import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { concertDate } from "@/lib/concerts";
import type { ConcertView } from "@/lib/data/public-concerts";
import { SectionHeading } from "@/components/ui/section-heading";

/** Upcoming concerts on an artist's profile, each linking to its poster page. */
export function ArtistConcerts({ concerts }: { concerts: ConcertView[] }) {
  return (
    <section id="conciertos" className="relative scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading eyebrow="Agenda" title="Próximos conciertos" description="Ven a verlo en vivo antes de contratarlo para tu evento." titleClassName="font-general" />
        <ul className="mt-12 flex flex-col gap-3">
          {concerts.map((c) => {
            const d = concertDate(c.date);
            return (
              <li key={c.slug}>
                <Link
                  href={`/conciertos/${c.slug}`}
                  className="group flex items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-volt/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt sm:p-5"
                >
                  <span className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-volt text-ink">
                    <span className="font-display text-3xl font-black leading-none">{d.day}</span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{d.monthShort}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-volt">
                      {d.weekday} · {c.start} a {c.end}
                    </span>
                    <span className="mt-1 block truncate font-general text-lg font-semibold text-white">{c.title}</span>
                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-ink-mid">
                      <MapPin className="h-3.5 w-3.5 shrink-0" /> {c.venue}, {c.city}
                    </span>
                  </span>
                  <span className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white transition-colors group-hover:border-volt group-hover:bg-volt group-hover:text-ink sm:inline-flex">
                    Ver afiche <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
