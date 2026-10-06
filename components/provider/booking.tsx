"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Flame, CalendarCheck, Sparkles } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { dayStatus, estimatePrice, formatLongDate, MONTHS, type DayStatus } from "@/lib/availability";
import { formatBs, whatsappLink } from "@/lib/format";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const SLIDE: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -60 }),
};

const STATUS_STYLES: Record<DayStatus, string> = {
  available: "border-emerald-400/25 bg-emerald-400/[0.08] text-white hover:border-emerald-400/70 hover:bg-emerald-400/15",
  few: "border-volt/30 bg-volt/[0.08] text-white hover:border-volt/80 hover:bg-volt/15",
  booked: "cursor-not-allowed border-transparent bg-ink-dark/25 text-ink-mid/60 line-through",
};

const DOT: Record<DayStatus, string> = {
  available: "bg-emerald-400",
  few: "bg-volt",
  booked: "bg-ink-mid/50",
};

const LEGEND: { status: DayStatus; label: string }[] = [
  { status: "available", label: "Disponible" },
  { status: "few", label: "Pocas fechas" },
  { status: "booked", label: "Ocupado" },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function Calendar({
  provider,
  today,
  selected,
  onSelect,
}: {
  provider: Provider;
  today: Date;
  selected: Date | null;
  onSelect: (d: Date) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(1);
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const lead = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: (Date | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  function go(delta: number) {
    setDirection(delta);
    setOffset((o) => Math.min(11, Math.max(0, o + delta)));
  }

  return (
    <div className="glass rounded-3xl p-5 shadow-card sm:p-7">
      <div className="flex items-center justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h3
            key={offset}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="font-general text-xl font-semibold capitalize text-white sm:text-2xl"
          >
            {MONTHS[month.getMonth()]} <span className="text-ink-mid">{month.getFullYear()}</span>
          </motion.h3>
        </AnimatePresence>
        <div className="flex gap-2">
          <button
            onClick={() => go(-1)}
            disabled={offset === 0}
            aria-label="Mes anterior"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-ink-light/15 disabled:hover:text-ink-light"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => go(1)}
            disabled={offset === 11}
            aria-label="Mes siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-mid sm:gap-2">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="relative mt-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={offset}
            custom={direction}
            variants={SLIDE}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-7 gap-1.5 sm:gap-2"
          >
            {days.map((date, i) => {
              if (!date) return <span key={`blank-${i}`} />;
              const past = date < today;
              const status = dayStatus(provider.slug, date);
              const isSelected = selected?.getTime() === date.getTime();
              const isToday = date.getTime() === today.getTime();
              const disabled = past || status === "booked";
              return (
                <motion.button
                  key={date.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(date)}
                  whileTap={disabled ? undefined : { scale: 0.92 }}
                  aria-pressed={isSelected}
                  aria-label={`${formatLongDate(date)}: ${past ? "fecha pasada" : LEGEND.find((l) => l.status === status)?.label}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200 sm:rounded-2xl sm:text-base",
                    past ? "cursor-not-allowed border-transparent text-ink-mid/30" : STATUS_STYLES[status],
                    isSelected && "border-volt bg-volt text-ink shadow-glow hover:bg-volt",
                    isToday && !isSelected && "ring-1 ring-white/40"
                  )}
                >
                  {date.getDate()}
                  {!past && (
                    <span
                      className={cn(
                        "absolute bottom-1.5 h-1 w-1 rounded-full sm:bottom-2",
                        isSelected ? "bg-ink" : DOT[status]
                      )}
                    />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-light/10 pt-5 text-xs text-ink-mid">
        {LEGEND.map((l) => (
          <span key={l.status} className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", DOT[l.status])} />
            {l.label}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2 text-volt">
          <Sparkles className="h-3.5 w-3.5" />
          Lun a jue −{provider.promo.discount}%
        </span>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-white/5" />
      <div className="mt-8 grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

function Popularity({ count }: { count: number }) {
  const bars = [32, 45, 38, 58, 52, 66, 61, 74, 70, 86, 80, 100];
  return (
    <div className="rounded-2xl border border-volt/20 bg-volt/[0.06] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          <motion.span
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="flex"
          >
            <Flame className="h-4 w-4 fill-volt/30 text-volt" />
          </motion.span>
          Reservado {count} veces este mes
        </span>
        <span className="rounded-full bg-volt px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
          Alta demanda
        </span>
      </div>
      <div className="mt-4 flex h-10 items-end gap-1" aria-hidden>
        {bars.map((h, i) => (
          <motion.span
            key={i}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={cn("flex-1 rounded-sm", i === bars.length - 1 ? "bg-volt" : "bg-volt/25")}
          />
        ))}
      </div>
    </div>
  );
}

function PriceCard({ provider, selected }: { provider: Provider; selected: Date | null }) {
  const status = selected ? dayStatus(provider.slug, selected) : null;
  const estimate = selected ? estimatePrice(provider, selected) : null;
  const unit = provider.price.unit;

  return (
    <div className="glass-strong relative overflow-hidden rounded-3xl p-6 shadow-card sm:p-8">
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-volt/15 blur-3xl" />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Desde</p>
      <p className="mt-1 flex items-baseline gap-2">
        <span className="font-general text-5xl font-semibold tracking-tight text-white">{formatBs(provider.price.from)}</span>
        {unit && <span className="text-sm text-ink-mid">{unit}</span>}
      </p>

      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">Incluye</p>
      <ul className="mt-3 grid gap-2.5">
        {provider.price.includes.map((inc) => (
          <li key={inc} className="flex items-center gap-3 text-sm text-ink-light">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-volt/15">
              <Check className="h-3 w-3 text-volt" strokeWidth={3} />
            </span>
            {inc}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Popularity count={provider.price.monthlyBookings} />
      </div>

      <div className="mt-6 border-t border-ink-light/10 pt-6">
        <AnimatePresence mode="wait" initial={false}>
          {selected && estimate ? (
            <motion.div
              key={selected.toISOString()}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between">
                <p className="font-general text-lg font-semibold text-white">{formatLongDate(selected)}</p>
                {status === "few" && (
                  <span className="rounded-full border border-volt/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-volt">
                    Últimos cupos
                  </span>
                )}
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                {estimate.lines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4">
                    <span className={line.accent ? "text-volt" : "text-ink-mid"}>{line.label}</span>
                    <span className={line.accent ? "text-volt" : "text-ink-light"}>
                      {line.amount < 0 ? "−" : ""}
                      {formatBs(Math.abs(line.amount))}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-ink-light/15 pt-3">
                  <span className="font-medium text-white">Total estimado</span>
                  <span className="font-general text-2xl font-semibold text-white">
                    {formatBs(estimate.total)}
                    {unit && <span className="ml-1 text-xs font-normal text-ink-mid">{unit}</span>}
                  </span>
                </div>
              </div>
              <Button asChild className="mt-5 w-full">
                <a
                  href={whatsappLink(
                    provider.whatsapp,
                    `Hola ${provider.fullName}, quiero reservar el ${formatLongDate(selected)} (vi el perfil en VIBRA).`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <CalendarCheck className="h-4 w-4" />
                  Reservar esta fecha
                </a>
              </Button>
              <p className="mt-3 text-center text-xs text-ink-mid">Aún no se realizará ningún cobro.</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-ink-light/15 p-4 text-sm text-ink-mid"
            >
              <CalendarCheck className="h-5 w-5 shrink-0 text-ink-light" />
              Selecciona una fecha en el calendario para ver el precio estimado.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function Booking({ provider }: { provider: Provider }) {
  const [today, setToday] = useState<Date | null>(null);
  const [selected, setSelected] = useState<Date | null>(null);

  // "Today" depends on the visitor's clock, so the calendar renders after mount to avoid a hydration mismatch.
  useEffect(() => setToday(startOfDay(new Date())), []);

  return (
    <section id="disponibilidad" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          align="left"
          eyebrow="Precio y disponibilidad"
          title="Elige la fecha de tu evento"
          description="Consulta la agenda en tiempo real y conoce el precio estimado al instante."
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
              <Calendar provider={provider} today={today} selected={selected} onSelect={setSelected} />
            ) : (
              <CalendarSkeleton />
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-28"
          >
            <PriceCard provider={provider} selected={selected} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
