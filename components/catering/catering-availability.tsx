"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, Gift, Sparkles, Users } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { dayStatus, formatLongDate } from "@/lib/availability";
import { crew, quote, staffAvailable } from "@/lib/catering";
import { formatBs, whatsappLink } from "@/lib/format";
import { Calendar, CalendarSkeleton, startOfDay } from "@/components/provider/booking";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { usePlanner } from "@/components/catering/planner";
import { cn } from "@/lib/utils";

const LABELS = { available: "Disponible", few: "Últimos cupos", booked: "Reservado" } as const;

function DayPanel({ provider, date }: { provider: Provider; date: Date }) {
  const details = provider.catering!;
  const { menu, guests, corporate } = usePlanner();
  const q = quote(details, menu, guests, { corporate, date });
  const status = dayStatus(provider.slug, date);
  const free = staffAvailable(provider.slug, date, details.staffPool);
  const team = crew(details, guests);
  const needed = team.waiters + team.cooks;
  const day = date.getDay();
  const promos = [
    ...(day >= 1 && day <= 4 ? [`−${details.weekdayDiscount}% por ser de lunes a jueves`] : []),
    `−${details.corporateDiscount}% en eventos corporativos${corporate ? " (aplicado)" : ""}`,
    ...details.perks.map((p) => `${p.title}: ${p.description.toLowerCase()}`),
  ];

  return (
    <motion.div
      key={date.toISOString()}
      initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-serif text-3xl leading-none text-white">{formatLongDate(date)}</p>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            status === "few" ? "border-volt/40 text-volt" : "border-emerald-400/40 text-emerald-300"
          )}
        >
          {LABELS[status]}
        </span>
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Costo estimado</p>
      <p className="mt-1 font-general text-4xl font-semibold tracking-tight text-white">{formatBs(q.total)}</p>
      <p className="text-xs text-ink-mid">
        {menu.name} · {q.billed} invitados
      </p>

      <div className="mt-6 rounded-2xl border border-ink-light/10 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-white">
            <Users className="h-4 w-4 text-volt" />
            Personal disponible
          </span>
          <span className="tabular-nums text-ink-light">
            {free} de {details.staffPool}
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(free / details.staffPool) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn("h-full rounded-full", free >= needed ? "bg-emerald-400" : "bg-volt")}
          />
        </div>
        <p className="mt-2 text-xs text-ink-mid">
          {free >= needed
            ? `Tu evento necesita ${needed} personas: ${team.waiters} meseros y ${team.cooks} cocineros.`
            : `Necesitas ${needed} personas; confirma pronto o reduce invitados.`}
        </p>
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">
        <Gift className="h-3.5 w-3.5 text-volt" />
        Promociones
      </p>
      <ul className="mt-3 grid gap-2">
        {promos.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-ink-light">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-volt" />
            {p}
          </li>
        ))}
      </ul>

      <Button asChild className="mt-6 w-full">
        <a
          href={whatsappLink(
            provider.whatsapp,
            `Hola ${provider.fullName}, quiero reservar el ${formatLongDate(date)} para ${guests} invitados con el ${menu.name} (vi el perfil en VIBRA).`
          )}
          target="_blank"
          rel="noopener noreferrer"
        >
          <CalendarCheck className="h-4 w-4" />
          Reservar esta fecha
        </a>
      </Button>
    </motion.div>
  );
}

export function CateringAvailability({ provider }: { provider: Provider }) {
  const [today, setToday] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  // "Today" depends on the visitor's clock, so the calendar renders after mount to avoid a hydration mismatch.
  useEffect(() => setToday(startOfDay(new Date())), []);

  return (
    <section id="disponibilidad" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          align="left"
          eyebrow="Disponibilidad"
          title={
            <>
              Reserva la fecha <span className="font-serif font-normal italic">de tu evento</span>
            </>
          }
          description="Agenda en tiempo real. Elige un día para ver el costo, el equipo disponible y las promociones que aplican."
          titleClassName="font-general"
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {today ? (
              <Calendar
                provider={provider}
                today={today}
                selected={selected}
                onSelect={setSelected}
                labels={LABELS}
                note={<>Lun a jue −{provider.catering!.weekdayDiscount}%</>}
              />
            ) : (
              <CalendarSkeleton />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-card sm:p-8 lg:sticky lg:top-28"
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-volt/15 blur-3xl" />
            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                {selected ? (
                  <DayPanel key={selected.toISOString()} provider={provider} date={selected} />
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-start gap-4"
                  >
                    <CalendarCheck className="h-8 w-8 text-volt" />
                    <p className="font-serif text-3xl leading-tight text-white">Elige un día en el calendario</p>
                    <p className="text-sm text-ink-mid">
                      Verás el costo estimado con tu menú e invitados, el personal disponible y las promociones de esa fecha.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
