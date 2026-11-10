import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, Clock, MapPin, Play, Ticket } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ConcertPoster } from "@/components/concerts/concert-poster";
import { ConcertCard, posterArtist } from "@/components/concerts/concert-card";
import { CalendarButtons, Countdown, InterestButton, ShareButtons } from "@/components/concerts/concert-actions";
import { getPublicConcert, getPublicConcerts } from "@/lib/data/public-concerts";
import { concertDate, concertInstant, isLive, isUpcoming, mapsUrl, priceText } from "@/lib/concerts";
import { cn } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPublicConcerts()).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublicConcert(slug);
  if (!c) return {};
  const d = concertDate(c.date);
  const description = `${c.artist.fullName} en vivo el ${d.long}, de ${c.start} a ${c.end}, en ${c.venue} (${c.city}).`;
  return {
    title: `${c.title} — ${d.day} ${d.monthShort} · VIBRA`,
    description,
    openGraph: { title: `${c.title} · ${c.artist.fullName}`, description, images: [c.posterUrl ?? c.artist.heroImage] },
  };
}

export default async function ConcertPage({ params }: { params: Params }) {
  const { slug } = await params;
  const c = await getPublicConcert(slug);
  if (!c) notFound();

  const d = concertDate(c.date);
  const upcoming = isUpcoming(c);
  const live = isLive(c);
  const others = (await getPublicConcerts()).filter((x) => x.slug !== c.slug && isUpcoming(x)).slice(0, 3);
  const tracks = (c.artist.music?.tracks ?? []).filter((t) => t.youtubeId).slice(0, 3);
  const status = live ? "En vivo ahora" : upcoming ? "Próximamente" : "Finalizado";

  return (
    <main className="relative overflow-x-clip">
      <Navbar />

      <section className="relative pb-20 pt-28 sm:pt-36">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-24 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-volt/10 blur-[140px]" />
        <div className="mx-auto max-w-6xl px-6">
          <Link href="/conciertos" className="inline-flex items-center gap-2 text-sm text-ink-mid hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Cartelera
          </Link>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-16">
            <div className="lg:sticky lg:top-28">
              <ConcertPoster concert={c} artist={posterArtist(c.artist)} priority className="shadow-[0_40px_120px_-30px_rgba(226,232,0,0.35)]" />
            </div>

            <div>
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]",
                  upcoming ? "bg-volt text-ink" : "border border-white/15 text-ink-mid"
                )}
              >
                {live && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink" />}
                {status}
              </span>
              <h1 className="mt-4 font-general text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">{c.title}</h1>
              <Link href={`/proveedores/${c.artist.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-lg text-ink-light hover:text-volt">
                {c.artist.fullName} <ArrowUpRight className="h-4 w-4" />
              </Link>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-2">
                {[
                  { icon: CalendarDays, label: "Fecha", value: <span className="first-letter:uppercase">{d.long}</span> },
                  { icon: Clock, label: "Hora", value: `${c.start} a ${c.end} (hora de Bolivia)` },
                  {
                    icon: MapPin,
                    label: "Lugar",
                    value: (
                      <>
                        {c.venue}
                        {c.address && <span className="block text-ink-mid">{c.address}</span>}
                        <span className="block text-ink-mid">{c.city}, Bolivia</span>
                        <a href={mapsUrl(c)} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-volt hover:underline">
                          Ver en el mapa <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </>
                    ),
                  },
                  { icon: Ticket, label: "Entrada", value: priceText(c.price) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-ink p-5">
                    <dt className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mid">
                      <Icon className="h-3.5 w-3.5 text-volt" /> {label}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-white">{value}</dd>
                  </div>
                ))}
              </dl>

              {upcoming && <Countdown className="mt-8" start={concertInstant(c, "start").toISOString()} end={concertInstant(c, "end").toISOString()} />}

              <div className="mt-8 flex flex-col gap-5">
                <InterestButton slug={c.slug} initial={c.interested} />
                {c.ticketUrl && upcoming && (
                  <a href={c.ticketUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 w-fit items-center gap-2 rounded-full border border-volt px-6 text-sm font-semibold text-volt hover:bg-volt hover:text-ink">
                    <Ticket className="h-4 w-4" /> Conseguir entradas
                  </a>
                )}
                {upcoming && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Guárdalo en tu calendario</p>
                    <CalendarButtons concert={c} artistName={c.artist.fullName} />
                  </div>
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Invita a tu gente</p>
                  <ShareButtons text={`${c.title} · ${d.weekday} ${d.day} de ${d.month}, ${c.start} hrs en ${c.venue}`} />
                </div>
              </div>

              {c.description && (
                <div className="mt-12">
                  <h2 className="font-general text-xl font-semibold text-white">Sobre el concierto</h2>
                  <p className="mt-3 max-w-prose leading-relaxed text-ink-light/85">{c.description}</p>
                </div>
              )}

              <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">El artista</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                    <Image src={c.artist.music?.cover ?? c.artist.logo?.src ?? c.artist.heroImage} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-general text-lg font-semibold text-white">{c.artist.fullName}</p>
                    <p className="text-sm text-ink-mid">{c.artist.tagline}</p>
                  </div>
                </div>
                {tracks.length > 0 && (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                    {tracks.map((t) => (
                      <li key={t.youtubeId}>
                        <a href={`https://www.youtube.com/watch?v=${t.youtubeId}`} target="_blank" rel="noopener noreferrer" className="group block">
                          <div className="relative aspect-video overflow-hidden rounded-xl bg-white/5">
                            <Image src={`https://i.ytimg.com/vi/${t.youtubeId}/hqdefault.jpg`} alt="" fill sizes="(max-width: 640px) 90vw, 200px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-volt text-ink">
                                <Play className="h-4 w-4 translate-x-px" fill="currentColor" />
                              </span>
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs text-ink-light group-hover:text-white">{t.title}</p>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/proveedores/${c.artist.slug}`} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-white hover:border-volt/60">
                  Ver perfil y contratar <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="otros" className="pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 id="otros" className="font-general text-2xl font-semibold text-white">
              Otros conciertos
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((x) => (
                <ConcertCard key={x.slug} concert={x} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
