"use client";

import { useEffect } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "motion/react";
import { Briefcase, ChefHat, ConciergeBell, PartyPopper, Send, Users } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatBs, whatsappLink } from "@/lib/format";
import { crew, GUEST_MARKS, MAX_GUESTS, MIN_GUESTS, quote } from "@/lib/catering";
import { SectionHeading } from "@/components/ui/section-heading";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePlanner } from "@/components/catering/planner";
import { cn } from "@/lib/utils";

/** A number that glides to its new value instead of jumping. */
export function useGlide(value: number) {
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.6 });
  useEffect(() => spring.set(value), [spring, value]);
  return spring;
}

function Glide({ value, format }: { value: MotionValue<number>; format: (v: number) => string }) {
  const text = useTransform(value, format);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

export function EventCalculator({ provider }: { provider: Provider }) {
  const details = provider.catering!;
  const { menu, setMenuId, guests, setGuests, corporate, setCorporate } = usePlanner();
  const q = quote(details, menu, guests, { corporate });
  const team = crew(details, guests);

  const guestsGlide = useGlide(guests);
  const totalGlide = useGlide(q.total);
  const perHeadGlide = useGlide(q.total / Math.max(guests, menu.minGuests));
  const pct = ((guests - MIN_GUESTS) / (MAX_GUESTS - MIN_GUESTS)) * 100;

  const message = `Hola ${provider.fullName}, quiero cotizar el ${menu.name} para ${guests} invitados${
    corporate ? " (evento corporativo)" : ""
  }. Estimado en VIBRA: ${formatBs(q.total)}.`;

  return (
    <section id="calculadora" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          align="left"
          eyebrow="Calculadora de eventos"
          title={
            <>
              Tu evento, <span className="font-serif font-normal italic text-volt">cotizado al instante</span>
            </>
          }
          description="Mueve el control, elige el menú y mira cómo se arma tu presupuesto en tiempo real."
          titleClassName="font-general"
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="glass-strong relative mt-12 grid overflow-hidden rounded-[2.5rem] shadow-card lg:grid-cols-[1.3fr_1fr]"
        >
          <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-volt/10 blur-[100px]" />

          {/* Controls */}
          <div className="relative p-6 sm:p-10">
            <label htmlFor="guests" className="font-serif text-2xl italic text-ink-light sm:text-3xl">
              ¿Cuántas personas asistirán?
            </label>
            <p className="mt-4 flex items-baseline gap-3">
              <span className="font-general text-7xl font-semibold leading-none tracking-tight text-white sm:text-8xl">
                <Glide value={guestsGlide} format={(v) => Math.round(v).toString()} />
              </span>
              <span className="text-ink-mid">invitados</span>
            </p>

            <div className="relative mt-8">
              <input
                id="guests"
                type="range"
                min={MIN_GUESTS}
                max={MAX_GUESTS}
                step={10}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="range-volt w-full"
                style={{ background: `linear-gradient(to right, #E2E800 ${pct}%, rgba(214,214,214,0.12) ${pct}%)` }}
              />
              <div className="relative mt-4 h-8">
                {GUEST_MARKS.map((mark) => (
                  <button
                    key={mark}
                    type="button"
                    onClick={() => setGuests(mark)}
                    className={cn(
                      "absolute -translate-x-1/2 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
                      guests === mark ? "bg-volt text-ink" : "text-ink-mid hover:text-white"
                    )}
                    style={{ left: `${((mark - MIN_GUESTS) / (MAX_GUESTS - MIN_GUESTS)) * 100}%` }}
                  >
                    {mark}
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Menú</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {details.menus.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMenuId(m.id)}
                  aria-pressed={menu.id === m.id}
                  className={cn(
                    "rounded-full border px-3.5 py-2 text-sm transition-all duration-300",
                    menu.id === m.id
                      ? "border-volt bg-volt/15 text-white"
                      : "border-ink-light/10 text-ink-light hover:border-ink-light/30 hover:text-white"
                  )}
                >
                  {m.name}
                  <span className="ml-2 text-xs text-ink-mid">{formatBs(m.pricePerPerson)}</span>
                </button>
              ))}
            </div>

            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Tipo de evento</p>
            <div className="glass mt-3 inline-flex rounded-full p-1">
              {[
                { on: false, label: "Social", icon: PartyPopper },
                { on: true, label: "Corporativo", icon: Briefcase },
              ].map(({ on, label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCorporate(on)}
                  aria-pressed={corporate === on}
                  className={cn(
                    "relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
                    corporate === on ? "text-ink" : "text-ink-light hover:text-white"
                  )}
                >
                  {corporate === on && (
                    <motion.span layoutId="event-type" className="absolute inset-0 rounded-full bg-volt" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <Icon className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                  {on && (
                    <span className={cn("relative text-[10px] font-bold", corporate ? "text-ink" : "text-volt")}>
                      −{details.corporateDiscount}%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Estimate */}
          <div className="relative border-t border-ink-light/10 bg-white/[0.02] p-6 sm:p-10 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Costo estimado</p>
            <p className="mt-3 font-general text-5xl font-semibold tracking-tight text-volt drop-shadow-[0_0_30px_rgba(226,232,0,0.3)] sm:text-6xl">
              <Glide value={totalGlide} format={formatBs} />
            </p>
            <p className="mt-2 text-sm text-ink-mid">
              <Glide value={perHeadGlide} format={formatBs} /> por persona
            </p>

            <div className="mt-7 grid gap-2.5 border-t border-dashed border-ink-light/15 pt-5 text-sm">
              {q.lines.map((line) => (
                <div key={line.label} className="flex justify-between gap-4">
                  <span className={line.accent ? "text-volt" : "text-ink-mid"}>{line.label}</span>
                  <span className={line.accent ? "text-volt" : "text-ink-light"}>
                    {line.amount < 0 ? "−" : ""}
                    {formatBs(Math.abs(line.amount))}
                  </span>
                </div>
              ))}
              {q.belowMinimum && (
                <p className="text-xs text-ink-mid">Este menú se cotiza desde {menu.minGuests} invitados.</p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2">
              {[
                { icon: ConciergeBell, value: team.waiters, label: "Meseros" },
                { icon: ChefHat, value: team.cooks, label: "Cocineros" },
                { icon: Users, value: Math.max(guests, menu.minGuests), label: "Cubiertos" },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="rounded-2xl border border-ink-light/10 p-3 text-center">
                  <Icon className="mx-auto h-4 w-4 text-volt" />
                  <p className="mt-1.5 font-general text-xl font-semibold text-white">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink-mid">{label}</p>
                </div>
              ))}
            </div>

            <MagneticButton asChild size="lg" className="mt-7 w-full" wrapperClassName="block w-full">
              <a href={whatsappLink(provider.whatsapp, message)} target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4" />
                Solicitar cotización
              </a>
            </MagneticButton>
            <p className="mt-3 text-center text-xs text-ink-mid">Incluye vajilla, mantelería, montaje y limpieza.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
