"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Beer,
  Check,
  Copy,
  Disc3,
  ExternalLink,
  Lock,
  Music4,
  RotateCcw,
  Sparkles,
  Star,
  UtensilsCrossed,
  Wand2,
} from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatLongDate } from "@/lib/availability";
import { formatBs, whatsappLink } from "@/lib/format";
import {
  EVENT_TYPES,
  eventMenu,
  GUESTS,
  optionsFor,
  SERVICES,
  suggestedBudget,
  UPCOMING_SERVICES,
  type Service,
  type ServiceId,
} from "@/lib/event-builder";
import { DatePicker } from "@/components/builder/date-picker";
import { fromDateKey, toDateKey, type Draft } from "@/components/builder/use-draft";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SERVICE_ICONS: Record<ServiceId, typeof Music4> = {
  musica: Music4,
  dj: Disc3,
  catering: UtensilsCrossed,
  bebidas: Beer,
};

const STATUS_LABEL = { available: "Disponible", few: "Últimos cupos", booked: "Reservado" } as const;

type Update = (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;

export interface StepProps {
  draft: Draft;
  update: Update;
  providers: Provider[];
}

function StepTitle({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-volt">{eyebrow}</p>
      <h2 className="mt-3 text-balance font-general text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 max-w-xl text-ink-mid">{description}</p>}
    </div>
  );
}

/* 1 — Event type */

export function StepType({ draft, update }: StepProps) {
  return (
    <div>
      <StepTitle eyebrow="Paso 1" title="¿Qué vamos a celebrar?" description="Elige el tipo de evento y te sugerimos los servicios que suele necesitar." />
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        {EVENT_TYPES.map((t, i) => {
          const active = draft.type === t.id;
          return (
            <motion.button
              key={t.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              aria-pressed={active}
              onClick={() =>
                update((d) => {
                  // Keep what the visitor already chose: a package's services before any type, and added providers always.
                  const picked = SERVICES.filter((s) => d.picks[s.id]).map((s) => s.id);
                  const kept = d.type ? picked : [...d.services, ...picked];
                  const guests = d.type || d.services.length ? d.guests : t.guests;
                  return {
                    type: t.id,
                    services: SERVICES.map((s) => s.id).filter((id) => t.services.includes(id) || kept.includes(id)),
                    guests,
                    budget: d.budgetTouched ? d.budget : suggestedBudget(guests),
                  };
                })
              }
              className={cn(
                "group relative aspect-[4/5] overflow-hidden rounded-3xl text-left ring-1 ring-inset transition-shadow duration-300",
                active ? "shadow-glow ring-2 ring-volt" : "ring-white/10"
              )}
            >
              <Image src={t.image} alt="" fill sizes="(max-width: 768px) 50vw, 260px" className="object-cover transition-transform duration-700 group-hover:scale-[1.07]" />
              <span className={cn("absolute inset-0 transition-colors duration-300", active ? "bg-ink/40" : "bg-gradient-to-t from-ink via-ink/40 to-ink/5")} />
              <span className="absolute inset-x-4 bottom-4 font-general text-lg font-semibold text-white sm:text-xl">{t.label}</span>
              {active && (
                <motion.span
                  layoutId="type-check"
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-volt text-ink"
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* 2 — Date, guests and budget */

export function StepDetails({ draft, update, providers, today }: StepProps & { today: Date | null }) {
  const relevant = providers.filter((p) =>
    SERVICES.some((s) => draft.services.includes(s.id) && s.categories.includes(p.category))
  );
  const date = fromDateKey(draft.date);
  const guestsPct = ((draft.guests - GUESTS.min) / (GUESTS.max - GUESTS.min)) * 100;
  const budgetMax = 200000;
  const budgetPct = (draft.budget / budgetMax) * 100;

  return (
    <div>
      <StepTitle eyebrow="Paso 2" title="Fecha, invitados y presupuesto" description="Con estos datos calculamos precios reales y vemos quién está libre ese día." />
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        {today ? (
          <DatePicker today={today} value={date} onChange={(d) => update({ date: toDateKey(d) })} providers={relevant.length ? relevant : providers} />
        ) : (
          <div className="glass aspect-square animate-pulse rounded-3xl" />
        )}

        <div className="flex flex-col gap-6">
          <div className="glass rounded-3xl p-5 sm:p-6">
            <label htmlFor="guests" className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">
              Invitados
            </label>
            <p className="mt-2 font-general text-5xl font-semibold tracking-tight text-white">{draft.guests}</p>
            <input
              id="guests"
              type="range"
              min={GUESTS.min}
              max={GUESTS.max}
              step={GUESTS.step}
              value={draft.guests}
              onChange={(e) => {
                const guests = Number(e.target.value);
                update((d) => ({ guests, budget: d.budgetTouched ? d.budget : suggestedBudget(guests) }));
              }}
              className="range-volt mt-5 w-full"
              style={{ background: `linear-gradient(to right, #E2E800 ${guestsPct}%, rgba(214,214,214,0.12) ${guestsPct}%)` }}
            />
            <div className="mt-2 flex justify-between text-xs text-ink-mid">
              <span>{GUESTS.min}</span>
              <span>{GUESTS.max}</span>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-6">
            <label htmlFor="budget" className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-mid">
              Presupuesto total
            </label>
            <p className="mt-2 font-general text-5xl font-semibold tracking-tight text-white">{formatBs(draft.budget)}</p>
            <input
              id="budget"
              type="range"
              min={0}
              max={budgetMax}
              step={500}
              value={draft.budget}
              onChange={(e) => update({ budget: Number(e.target.value), budgetTouched: true })}
              className="range-volt mt-5 w-full"
              style={{ background: `linear-gradient(to right, #E2E800 ${budgetPct}%, rgba(214,214,214,0.12) ${budgetPct}%)` }}
            />
            <p className="mt-3 text-xs text-ink-mid">
              {draft.budgetTouched ? (
                <button type="button" onClick={() => update((d) => ({ budget: suggestedBudget(d.guests), budgetTouched: false }))} className="text-volt hover:underline">
                  Usar el sugerido para {draft.guests} invitados
                </button>
              ) : (
                `Sugerido para ${draft.guests} invitados. Muévelo si ya tienes un monto en mente.`
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3 — Services */

export function StepServices({ draft, update }: StepProps) {
  function toggle(id: ServiceId) {
    update((d) => {
      const on = d.services.includes(id);
      const picks = { ...d.picks };
      if (on) delete picks[id];
      return { services: on ? d.services.filter((s) => s !== id) : [...d.services, id], picks };
    });
  }

  return (
    <div>
      <StepTitle eyebrow="Paso 3" title="¿Qué necesitas para tu evento?" description="Marcamos lo que suele pedirse para este tipo de evento. Agrega o quita lo que quieras." />
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => {
          const Icon = SERVICE_ICONS[s.id];
          const on = draft.services.includes(s.id);
          return (
            <motion.button
              key={s.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => toggle(s.id)}
              aria-pressed={on}
              className={cn(
                "group flex items-center gap-4 rounded-3xl border p-5 text-left transition-all duration-300",
                on ? "border-volt/60 bg-volt/[0.08] shadow-glow" : "glass hover:border-ink-light/30"
              )}
            >
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors", on ? "bg-volt text-ink" : "bg-white/5 text-volt")}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block font-general text-lg font-semibold text-white">{s.label}</span>
                <span className="block text-sm text-ink-mid">{s.description}</span>
              </span>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border transition-all", on ? "border-volt bg-volt text-ink" : "border-ink-light/20")}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </motion.button>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-ink-mid">
        <span className="mr-1">Pronto en VIBRA:</span>
        {UPCOMING_SERVICES.map((s) => (
          <span key={s} className="flex items-center gap-1.5 rounded-full border border-dashed border-ink-light/15 px-3 py-1.5 text-xs">
            <Lock className="h-3 w-3" />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

/* 4 — Providers */

function ServiceRow({ service, draft, update, providers }: StepProps & { service: Service }) {
  const date = fromDateKey(draft.date);
  const options = optionsFor(service, providers, draft.guests, date);
  const Icon = SERVICE_ICONS[service.id];
  const picked = draft.picks[service.id];

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-general text-xl font-semibold text-white">
          <Icon className="h-5 w-5 text-volt" />
          {service.label}
        </h3>
        {picked && (
          <button type="button" onClick={() => update((d) => ({ picks: { ...d.picks, [service.id]: undefined } }))} className="text-xs text-ink-mid hover:text-white">
            Quitar
          </button>
        )}
      </div>
      <div className="scrollbar-none -mx-6 mt-4 flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
        {options.map(({ provider: p, price, status }, i) => {
          const booked = status === "booked";
          const active = picked === p.slug;
          const recommended = i === 0 && !booked;
          return (
            <motion.div
              key={p.slug}
              whileHover={booked ? undefined : { y: -3 }}
              className={cn(
                "relative w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl border transition-all duration-300 sm:w-auto sm:max-w-none",
                active ? "border-volt shadow-glow" : "border-ink-light/10",
                booked && "opacity-45"
              )}
            >
              <button
                type="button"
                disabled={booked}
                aria-pressed={active}
                onClick={() => update((d) => ({ picks: { ...d.picks, [service.id]: p.slug } }))}
                className="block w-full text-left disabled:cursor-not-allowed"
              >
                <span className="relative block h-28 overflow-hidden">
                  <Image src={p.heroImage} alt="" fill sizes="320px" className="object-cover" />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
                  {recommended && (
                    <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-volt px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ink">
                      <Sparkles className="h-3 w-3" />
                      Recomendado
                    </span>
                  )}
                  {active && (
                    <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-volt text-ink">
                      <Check className="h-4 w-4" strokeWidth={3} />
                    </span>
                  )}
                  <span className="absolute inset-x-4 bottom-3 font-general text-lg font-semibold text-white">{p.fullName}</span>
                </span>
                <span className="flex items-end justify-between gap-3 bg-white/[0.02] px-4 py-3">
                  <span>
                    <span className="block font-general text-xl font-semibold text-white">{formatBs(price)}</span>
                    <span className="block text-[11px] text-ink-mid">
                      {p.price.unit
                        ? `${eventMenu(p, draft.guests)?.name ?? "Menú"} · ${draft.guests} invitados`
                        : "por el evento"}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-1 text-xs">
                    <span className="flex items-center gap-1 text-ink-light">
                      <Star className="h-3 w-3 fill-volt text-volt" />
                      {p.rating.toFixed(1)}
                    </span>
                    {status && (
                      <span className={cn(status === "available" ? "text-emerald-300" : status === "few" ? "text-volt" : "text-ink-mid")}>
                        {STATUS_LABEL[status]}
                      </span>
                    )}
                  </span>
                </span>
              </button>
              <Link
                href={`/proveedores/${p.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-1.5 border-t border-ink-light/10 py-2 text-xs text-ink-mid transition-colors hover:text-white"
              >
                Ver perfil
                <ExternalLink className="h-3 w-3" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function StepProviders(props: StepProps) {
  const { draft, update, providers } = props;
  const services = SERVICES.filter((s) => draft.services.includes(s.id));
  const date = fromDateKey(draft.date);

  function autoPick() {
    const picks: Draft["picks"] = {};
    for (const s of services) {
      const best = optionsFor(s, providers, draft.guests, date).find((o) => o.status !== "booked");
      if (best) picks[s.id] = best.provider.slug;
    }
    update({ picks });
  }

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <StepTitle
          eyebrow="Paso 4"
          title="Elige a tus proveedores"
          description={date ? `Precios para ${draft.guests} invitados el ${formatLongDate(date).toLowerCase()}.` : `Precios para ${draft.guests} invitados.`}
        />
        <Button type="button" variant="outline" size="sm" onClick={autoPick} className="shrink-0">
          <Wand2 className="h-4 w-4" />
          Armar automáticamente
        </Button>
      </div>
      <div className="mt-8 flex flex-col gap-10">
        {services.map((s) => (
          <ServiceRow key={s.id} service={s} {...props} />
        ))}
      </div>
    </div>
  );
}

/* 5 — Summary */

export function StepSummary({ draft, providers, onReset }: StepProps & { onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const date = fromDateKey(draft.date);
  const type = EVENT_TYPES.find((t) => t.id === draft.type);
  const lines = SERVICES.flatMap((s) => {
    const p = providers.find((x) => x.slug === draft.picks[s.id]);
    if (!p) return [];
    const option = optionsFor(s, [p], draft.guests, date)[0];
    return [{ service: s, provider: p, price: option.price }];
  });
  const total = lines.reduce((sum, l) => sum + l.price, 0);
  const when = date ? formatLongDate(date).toLowerCase() : "fecha por definir";

  const text = [
    `Mi ${type?.label.toLowerCase() ?? "evento"} en VIBRA`,
    `${when} · ${draft.guests} invitados`,
    ...lines.map((l) => `• ${l.service.label}: ${l.provider.fullName} — ${formatBs(l.price)}`),
    `Total estimado: ${formatBs(total)} (presupuesto ${formatBs(draft.budget)})`,
  ].join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div>
      <StepTitle
        eyebrow="Paso 5"
        title={
          <>
            Tu {type?.label.toLowerCase() ?? "evento"}, <span className="text-volt">listo para reservar</span>
          </>
        }
        description="Envía la solicitud a cada proveedor. Te responden con la confirmación de fecha y precio."
      />

      {lines.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-dashed border-ink-light/15 p-6 text-ink-mid">
          Aún no elegiste proveedores. Vuelve al paso anterior para armar tu evento.
        </p>
      ) : (
        <ul className="mt-8 grid gap-3">
          {lines.map(({ service, provider, price }, i) => {
            const Icon = SERVICE_ICONS[service.id];
            return (
              <motion.li
                key={service.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="glass flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center"
              >
                <span className="flex flex-1 items-center gap-4">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
                    <Image src={provider.heroImage} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-xs text-ink-mid">
                      <Icon className="h-3.5 w-3.5 text-volt" />
                      {service.label}
                    </span>
                    <span className="block truncate font-general text-lg font-semibold text-white">{provider.fullName}</span>
                  </span>
                </span>
                <span className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="font-general text-lg font-semibold text-white">{formatBs(price)}</span>
                  <Button asChild size="sm">
                    <a
                      href={whatsappLink(
                        provider.whatsapp,
                        `Hola ${provider.fullName}, estoy organizando una ${type?.label.toLowerCase() ?? "celebración"} para ${draft.guests} invitados (${when}). ¿Tienen disponibilidad? Estimado en VIBRA: ${formatBs(price)}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Solicitar
                    </a>
                  </Button>
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={copy} disabled={lines.length === 0}>
          {copied ? <Check className="h-4 w-4 text-volt" /> : <Copy className="h-4 w-4" />}
          {copied ? "Resumen copiado" : "Copiar resumen"}
        </Button>
        <Button type="button" variant="ghost" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Empezar de nuevo
        </Button>
      </div>
    </div>
  );
}
