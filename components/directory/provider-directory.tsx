"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { dayStatus, formatLongDate, type DayStatus } from "@/lib/availability";
import { SERVICES, type ServiceId } from "@/lib/event-builder";
import { ProviderCard } from "@/components/provider/provider-card";
import { cn } from "@/lib/utils";

type Sort = "recomendados" | "calificacion" | "precio";

const SORTS: { id: Sort; label: string }[] = [
  { id: "recomendados", label: "Recomendados" },
  { id: "calificacion", label: "Mejor calificados" },
  { id: "precio", label: "Menor precio" },
];

const STATUS: Record<DayStatus, { label: string; className: string }> = {
  available: { label: "Disponible", className: "bg-emerald-400 text-ink" },
  few: { label: "Últimos cupos", className: "bg-volt text-ink" },
  booked: { label: "Reservado", className: "bg-ink-dark text-ink-light" },
};

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toInputValue(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Favours providers that are both well rated and proven on many events. */
function score(p: Provider) {
  return p.rating * Math.log10(10 + p.eventsCount);
}

export function ProviderDirectory({ providers }: { providers: Provider[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const service = (SERVICES.find((s) => s.id === params.get("servicio"))?.id ?? null) as ServiceId | null;
  const dateValue = params.get("fecha");
  const date = parseDate(dateValue);
  const sort = (SORTS.find((s) => s.id === params.get("orden"))?.id ?? "recomendados") as Sort;
  const onlyFree = params.get("todos") !== "1";
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [today, setToday] = useState<string | null>(null);

  useEffect(() => setToday(toInputValue(new Date())), []);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  // The search box updates the URL after typing settles, so the list stays shareable.
  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== query.trim()) setParam("q", query.trim() || null);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const categories = service ? SERVICES.find((s) => s.id === service)!.categories : null;
    return providers
      .filter((p) => !categories || categories.includes(p.category))
      .filter(
        (p) =>
          !q ||
          [p.fullName, p.category, p.kicker, ...p.tags].some((t) =>
            t.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(q.normalize("NFD").replace(/\p{M}/gu, ""))
          )
      )
      .map((p) => ({ provider: p, status: date ? dayStatus(p.slug, date) : null }))
      .filter((r) => !date || !onlyFree || r.status !== "booked")
      .sort((a, b) => {
        if (sort === "calificacion") return b.provider.rating - a.provider.rating || b.provider.reviewsCount - a.provider.reviewsCount;
        if (sort === "precio") return a.provider.price.from - b.provider.price.from;
        return score(b.provider) - score(a.provider);
      });
  }, [providers, service, query, date, onlyFree, sort]);

  const hasFilters = Boolean(service || date || query.trim());

  function clearAll() {
    setQuery("");
    router.replace(pathname, { scroll: false });
  }

  return (
    <section className="relative pb-28 pt-32 sm:pt-40">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-radial-fade" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-volt/30 bg-volt/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-volt">
            Proveedores
          </p>
          <h1 className="mt-5 text-balance font-general text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Todo lo que tu evento necesita, <span className="text-volt">en un lugar</span>
          </h1>
          <p className="mt-4 text-ink-mid sm:text-lg">
            Compara proveedores verificados de Cochabamba, revisa su disponibilidad y agrégalos a tu evento.
          </p>
        </div>

        {/* Filters */}
        <div className="glass-strong z-30 mt-10 lg:sticky lg:top-24 rounded-3xl p-3 shadow-card sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Buscar proveedores</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mid" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, estilo o tipo de evento…"
                className="h-12 w-full rounded-full border border-ink-light/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-ink-mid focus:border-volt/60 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center">
              <label className="relative">
                <span className="sr-only">Fecha del evento</span>
                <CalendarDays className="pointer-events-none absolute left-3.5 lg:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-volt" />
                <input
                  type="date"
                  value={dateValue && date ? dateValue : ""}
                  min={today ?? undefined}
                  onChange={(e) => setParam("fecha", e.target.value || null)}
                  className="h-12 w-full rounded-full border border-ink-light/10 bg-white/[0.03] pl-9 pr-2 lg:pl-11 lg:pr-3 text-sm text-white [color-scheme:dark] focus:border-volt/60 focus:outline-none"
                />
              </label>
              <label className="relative">
                <span className="sr-only">Ordenar</span>
                <SlidersHorizontal className="pointer-events-none absolute left-3.5 lg:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mid" />
                <select
                  value={sort}
                  onChange={(e) => setParam("orden", e.target.value === "recomendados" ? null : e.target.value)}
                  className="h-12 w-full appearance-none rounded-full border border-ink-light/10 bg-white/[0.03] pl-9 pr-3 lg:pl-11 lg:pr-6 text-sm text-white [color-scheme:dark] focus:border-volt/60 focus:outline-none"
                >
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="scrollbar-none -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 sm:-mx-4 sm:px-4" role="tablist" aria-label="Filtrar por servicio">
            {[{ id: null, label: "Todos" }, ...SERVICES.map((s) => ({ id: s.id, label: s.label }))].map((s) => {
              const active = service === s.id;
              return (
                <button
                  key={s.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setParam("servicio", s.id)}
                  className={cn(
                    "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-ink" : "text-ink-light hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span layoutId="dir-filter" className="absolute inset-0 rounded-full bg-volt" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                  )}
                  <span className="relative">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-ink-mid">
            <span className="font-semibold text-white">{results.length}</span>{" "}
            {results.length === 1 ? "proveedor" : "proveedores"}
            {date && <> {onlyFree ? (results.length === 1 ? "libre" : "libres") : ""} el {formatLongDate(date).toLowerCase()}</>}
          </p>
          <div className="flex items-center gap-4">
            {date && (
              <label className="flex cursor-pointer items-center gap-2 text-ink-light">
                <input
                  type="checkbox"
                  checked={!onlyFree}
                  onChange={(e) => setParam("todos", e.target.checked ? "1" : null)}
                  className="h-4 w-4 accent-[#E2E800]"
                />
                Mostrar también reservados
              </label>
            )}
            {hasFilters && (
              <button type="button" onClick={clearAll} className="flex items-center gap-1 text-ink-mid hover:text-white">
                <X className="h-3.5 w-3.5" />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {results.length > 0 ? (
          <motion.div layout className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {results.map(({ provider: p, status }) => (
                <motion.div
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProviderCard
                    provider={p}
                    className={cn(status === "booked" && "opacity-50")}
                    badge={
                      status && (
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", STATUS[status].className)}>
                          {STATUS[status].label}
                        </span>
                      )
                    }
                  >
                    <Link
                      href={`/organizar?agregar=${p.slug}`}
                      className="flex items-center justify-center gap-1.5 border-t border-ink-light/10 py-3 text-sm font-medium text-ink-light transition-colors hover:bg-volt hover:text-ink"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar a mi evento
                    </Link>
                  </ProviderCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-ink-light/15 px-6 py-16 text-center">
            <p className="font-general text-xl font-semibold text-white">No encontramos proveedores con esos filtros</p>
            <p className="max-w-md text-sm text-ink-mid">Prueba otra fecha, otro servicio o una búsqueda más corta.</p>
            <button type="button" onClick={clearAll} className="rounded-full bg-volt px-5 py-2.5 text-sm font-semibold text-ink">
              Ver todos los proveedores
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
