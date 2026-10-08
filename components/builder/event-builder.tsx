"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useTransform } from "motion/react";
import { ArrowLeft, ArrowRight, CalendarDays, Check, Users, Wallet } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatLongDate } from "@/lib/availability";
import { formatBs } from "@/lib/format";
import { EVENT_TYPES, optionsFor, SERVICES } from "@/lib/event-builder";
import { useGlide } from "@/components/catering/event-calculator";
import { fromDateKey, useDraft, type Draft } from "@/components/builder/use-draft";
import { StepDetails, StepProviders, StepServices, StepSummary, StepType } from "@/components/builder/steps";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = ["Evento", "Detalles", "Servicios", "Proveedores", "Resumen"];
const EASE = [0.16, 1, 0.3, 1] as const;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function useSelection(draft: Draft, providers: Provider[]) {
  const date = fromDateKey(draft.date);
  const lines = SERVICES.flatMap((s) => {
    const p = providers.find((x) => x.slug === draft.picks[s.id]);
    if (!draft.services.includes(s.id) || !p) return [];
    return [{ service: s, provider: p, price: optionsFor(s, [p], draft.guests, date)[0].price }];
  });
  return { date, lines, total: lines.reduce((sum, l) => sum + l.price, 0) };
}

/** Why the visitor can't move on yet, or null. */
function blocker(draft: Draft) {
  switch (draft.step) {
    case 0:
      return draft.type ? null : "Elige un tipo de evento";
    case 1:
      return draft.date ? null : "Elige la fecha";
    case 2:
      return draft.services.length ? null : "Elige al menos un servicio";
    case 3:
      return Object.values(draft.picks).some(Boolean) ? null : "Elige al menos un proveedor";
    default:
      return null;
  }
}

function Total({ value }: { value: number }) {
  const glide = useGlide(value);
  const text = useTransform(glide, formatBs);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function SummaryPanel({ draft, providers }: { draft: Draft; providers: Provider[] }) {
  const { date, lines, total } = useSelection(draft, providers);
  const type = EVENT_TYPES.find((t) => t.id === draft.type);
  const ratio = draft.budget ? total / draft.budget : 0;
  const over = total - draft.budget;

  return (
    <div className="glass-strong relative overflow-hidden rounded-[2rem] shadow-card">
      <div className="relative h-28 overflow-hidden">
        <AnimatePresence initial={false}>
          {type && (
            <motion.div key={type.id} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
              <Image src={type.image} alt="" fill sizes="380px" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
        <div className="absolute inset-x-5 bottom-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-volt">Tu evento</p>
          <p className="font-general text-2xl font-semibold text-white">{type?.label ?? "Sin definir"}</p>
        </div>
      </div>

      <div className="p-5">
        <div className="grid gap-2 text-sm">
          <p className="flex items-center gap-2.5 text-ink-light">
            <CalendarDays className="h-4 w-4 text-volt" />
            {date ? formatLongDate(date) : <span className="text-ink-mid">Fecha por elegir</span>}
          </p>
          <p className="flex items-center gap-2.5 text-ink-light">
            <Users className="h-4 w-4 text-volt" />
            {draft.guests} invitados
          </p>
          <p className="flex items-center gap-2.5 text-ink-light">
            <Wallet className="h-4 w-4 text-volt" />
            Presupuesto {formatBs(draft.budget)}
          </p>
        </div>

        <ul className="mt-5 grid gap-2 border-t border-ink-light/10 pt-4 text-sm">
          <AnimatePresence initial={false}>
            {lines.map((l) => (
              <motion.li
                key={l.service.id}
                layout
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                className="flex justify-between gap-3"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] text-ink-mid">{l.service.label}</span>
                  <span className="block truncate text-white">{l.provider.fullName}</span>
                </span>
                <span className="shrink-0 self-end text-ink-light">{formatBs(l.price)}</span>
              </motion.li>
            ))}
          </AnimatePresence>
          {lines.length === 0 && <li className="text-ink-mid">Aquí aparecerán los proveedores que elijas.</li>}
        </ul>

        <div className="mt-5 border-t border-dashed border-ink-light/15 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink-mid">Total estimado</span>
            <span className="font-general text-3xl font-semibold text-white">
              <Total value={total} />
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              animate={{ width: `${Math.min(100, ratio * 100)}%` }}
              transition={{ duration: 0.6, ease: EASE }}
              className={cn("h-full rounded-full", over > 0 ? "bg-red-400" : "bg-volt")}
            />
          </div>
          <p className={cn("mt-2 text-xs", over > 0 ? "text-red-300" : "text-ink-mid")}>
            {over > 0
              ? `Te pasas por ${formatBs(over)}`
              : lines.length
                ? `Te quedan ${formatBs(-over)} del presupuesto`
                : "Los precios se calculan con tu fecha e invitados."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EventBuilder({ providers }: { providers: Provider[] }) {
  const { draft, update, reset, ready } = useDraft();
  const [today, setToday] = useState<Date | null>(null);
  const [direction, setDirection] = useState(1);
  const { total } = useSelection(draft, providers);

  // "Today" depends on the visitor's clock, so it is read after mount.
  useEffect(() => setToday(startOfDay(new Date())), []);

  // A saved date that has since passed is dropped.
  useEffect(() => {
    const date = fromDateKey(draft.date);
    if (today && date && date < today) update({ date: null });
  }, [today, draft.date, update]);

  const block = blocker(draft);
  const last = draft.step === STEPS.length - 1;

  function goTo(step: number) {
    setDirection(step > draft.step ? 1 : -1);
    update((d) => {
      // Entering the providers step for the first time picks the best option for each service.
      if (step === 3 && !Object.values(d.picks).some(Boolean)) {
        const date = fromDateKey(d.date);
        const picks: Draft["picks"] = {};
        for (const s of SERVICES.filter((x) => d.services.includes(x.id))) {
          const best = optionsFor(s, providers, d.guests, date).find((o) => o.status !== "booked");
          if (best) picks[s.id] = best.provider.slug;
        }
        return { step, picks };
      }
      return { step };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const props = { draft, update, providers };

  return (
    <section className="relative pb-40 pt-32 sm:pt-36 lg:pb-28">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-radial-fade" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="inline-flex rounded-full border border-volt/30 bg-volt/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-volt">
            Constructor de eventos
          </p>
          <h1 className="mt-5 text-balance font-general text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Arma tu evento en <span className="text-volt">5 pasos</span>
          </h1>
        </div>

        {/* Stepper */}
        <ol className="mx-auto mt-10 flex max-w-3xl items-center">
          {STEPS.map((label, i) => {
            const done = i < draft.step;
            const current = i === draft.step;
            const reachable = i <= draft.step || (i === draft.step + 1 && !block);
            return (
              <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => goTo(i)}
                  aria-current={current ? "step" : undefined}
                  className="group flex flex-col items-center gap-2 disabled:cursor-not-allowed"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300",
                      current && "border-volt bg-volt text-ink shadow-glow",
                      done && "border-volt/60 bg-volt/15 text-volt",
                      !current && !done && "border-ink-light/15 text-ink-mid"
                    )}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("hidden text-xs sm:block", current ? "text-white" : "text-ink-mid")}>{label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span className="relative mx-2 mb-0 h-px flex-1 bg-ink-light/10 sm:mb-6">
                    <motion.span
                      animate={{ scaleX: done ? 1 : 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="absolute inset-0 origin-left bg-volt"
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="min-w-0">
            {ready ? (
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={draft.step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 40, filter: "blur(6px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, x: direction * -40, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  {draft.step === 0 && <StepType {...props} />}
                  {draft.step === 1 && <StepDetails {...props} today={today} />}
                  {draft.step === 2 && <StepServices {...props} />}
                  {draft.step === 3 && <StepProviders {...props} />}
                  {draft.step === 4 && <StepSummary {...props} onReset={() => { reset(); setDirection(-1); }} />}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="glass h-96 animate-pulse rounded-3xl" />
            )}

            {/* Desktop navigation */}
            <div className="mt-10 hidden items-center justify-between gap-4 lg:flex">
              <Button type="button" variant="ghost" onClick={() => goTo(draft.step - 1)} className={cn(draft.step === 0 && "invisible")}>
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              {!last && (
                <div className="flex items-center gap-4">
                  {block && <span className="text-sm text-ink-mid">{block}</span>}
                  <Button type="button" size="lg" disabled={!!block} onClick={() => goTo(draft.step + 1)} className="group">
                    {draft.step === 3 ? "Ver resumen" : "Continuar"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-28 lg:block">
            <SummaryPanel draft={draft} providers={providers} />
          </aside>
        </div>
      </div>

      {/* Mobile bar: running total and navigation */}
      <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
        <div className="glass-strong flex items-center gap-3 rounded-2xl px-3 py-3 shadow-card">
          {draft.step > 0 && (
            <button type="button" onClick={() => goTo(draft.step - 1)} aria-label="Atrás" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-light/15 text-ink-light">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-ink-mid">{block ?? `Paso ${draft.step + 1} de ${STEPS.length}`}</p>
            <p className="font-general text-lg font-semibold text-white">
              <Total value={total} />
            </p>
          </div>
          {!last && (
            <Button type="button" size="sm" disabled={!!block} onClick={() => goTo(draft.step + 1)}>
              {draft.step === 3 ? "Resumen" : "Continuar"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
