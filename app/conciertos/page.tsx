import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, MapPin, Mic2, Ticket } from "lucide-react";
import { Navbar } from "@/components/sections/navbar";
import { Footer } from "@/components/sections/footer";
import { ConcertPoster } from "@/components/concerts/concert-poster";
import { ConcertCard, posterArtist } from "@/components/concerts/concert-card";
import { Countdown, InterestButton } from "@/components/concerts/concert-actions";
import { getPublicConcerts } from "@/lib/data/public-concerts";
import { concertDate, concertInstant, isUpcoming, priceText } from "@/lib/concerts";

export const metadata: Metadata = {
  title: "Conciertos — VIBRA",
  description: "La cartelera de conciertos de los artistas de VIBRA en Bolivia. Guarda la fecha, súmate como fan y no te pierdas ningún show.",
};

export const revalidate = 60;

export default async function ConciertosPage() {
  const concerts = await getPublicConcerts();
  const upcoming = concerts.filter((c) => isUpcoming(c));
  const past = concerts.filter((c) => !isUpcoming(c)).reverse();
  const [featured, ...rest] = upcoming;

  return (
    <main className="relative overflow-x-clip">
      <Navbar />

      <section className="relative pb-16 pt-32 sm:pt-40">
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-volt/10 blur-[140px]" />
        <div className="mx-auto max-w-6xl px-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-volt/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-volt">
            <Mic2 className="h-3.5 w-3.5" /> Cartelera
          </p>
          <h1 className="mt-5 max-w-3xl font-general text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-7xl">
            Conciertos <span className="text-volt">en vivo</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-mid">
            Los próximos shows de los artistas de VIBRA. Guarda la fecha, súmate como fan y compártelo con tu gente.
          </p>
        </div>
      </section>

      {featured ? (
        <section aria-labelledby="destacado" className="relative pb-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-16">
            <Link href={`/conciertos/${featured.slug}`} className="block rounded-[1.75rem] shadow-[0_40px_120px_-30px_rgba(226,232,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
              <ConcertPoster concert={featured} artist={posterArtist(featured.artist)} priority />
            </Link>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-volt">Próximo concierto</p>
              <h2 id="destacado" className="mt-3 font-general text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {featured.title}
              </h2>
              <Link href={`/proveedores/${featured.artist.slug}`} className="mt-2 inline-block text-ink-light underline-offset-4 hover:text-volt hover:underline">
                {featured.artist.fullName} · {featured.artist.kicker}
              </Link>
              <ul className="mt-8 grid gap-3 text-sm text-ink-light sm:grid-cols-2">
                <li className="flex items-center gap-3">
                  <CalendarDays className="h-4 w-4 text-volt" /> <span className="first-letter:uppercase">{concertDate(featured.date).long}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-volt" /> {featured.start} a {featured.end} (hora de Bolivia)
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-volt" /> {featured.venue}, {featured.city}
                </li>
                <li className="flex items-center gap-3">
                  <Ticket className="h-4 w-4 text-volt" /> {priceText(featured.price)}
                </li>
              </ul>
              <Countdown className="mt-8 max-w-md" start={concertInstant(featured, "start").toISOString()} end={concertInstant(featured, "end").toISOString()} />
              <InterestButton className="mt-8" slug={featured.slug} initial={featured.interested} />
              <Link href={`/conciertos/${featured.slug}`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-volt">
                Ver detalles, mapa y agendar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-10 text-center">
              <p className="font-general text-xl font-semibold text-white">Pronto anunciaremos nuevas fechas</p>
              <p className="mt-2 text-ink-mid">Mientras tanto, conoce a los artistas y escucha su música.</p>
              <Link href="/proveedores" className="mt-6 inline-flex h-11 items-center rounded-full bg-volt px-5 text-sm font-medium text-ink hover:brightness-110">
                Ver artistas
              </Link>
            </div>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section aria-labelledby="proximas" className="pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 id="proximas" className="font-general text-2xl font-semibold text-white">
              Más fechas
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((c) => (
                <ConcertCard key={c.slug} concert={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section aria-labelledby="pasados" className="pb-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 id="pasados" className="font-general text-2xl font-semibold text-white">
              Ya pasaron
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((c) => (
                <ConcertCard key={c.slug} concert={c} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pb-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-volt/30 bg-[#151600] p-8 sm:p-12">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-volt/20 blur-3xl" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.25em] text-volt">Para artistas</p>
            <h2 className="relative mt-3 max-w-2xl font-general text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Publica tus conciertos y suma fans en cada fecha
            </h2>
            <p className="relative mt-3 max-w-xl text-ink-light/80">
              Desde tu panel creas el concierto en un minuto: VIBRA arma el afiche con tu foto, lo suma a esta cartelera y te
              muestra cuántas personas se interesaron.
            </p>
            <Link href="/acceso?siguiente=/panel/conciertos" className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-volt px-6 text-sm font-semibold text-ink hover:brightness-110">
              Publicar un concierto <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
