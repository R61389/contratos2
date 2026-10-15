"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, CalendarCheck, CheckCircle2, Circle, ClipboardList, Eye, Inbox, Star, Wallet } from "lucide-react";
import { usePanel } from "@/components/panel/store";
import { Card, EmptyState, KpiCard, SectionHeader, StatusBadge } from "@/components/panel/ui/misc";
import { formatBs, MONTHS, parseDateKey, relativeTime, dateKey } from "@/lib/panel/format";
import { profileChecklist } from "@/lib/panel/logic";
import { cn } from "@/lib/utils";

function ProgressRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(214,214,214,0.1)" strokeWidth="7" />
        <motion.circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#E2E800"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-general text-xl font-semibold text-white">{value}%</span>
    </div>
  );
}

export function Overview() {
  const { ws } = usePanel();
  const today = dateKey(new Date());
  const pending = ws.requests.filter((r) => r.status === "pendiente");
  const upcoming = ws.requests
    .filter((r) => (r.status === "confirmada" || r.status === "aceptada") && r.date >= today)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const confirmed = upcoming.filter((r) => r.status === "confirmada");
  const income = confirmed.reduce((sum, r) => sum + r.proposedPrice, 0);
  const lastMonth = ws.stats[ws.stats.length - 1];
  const checklist = profileChecklist(ws);
  const done = checklist.filter((c) => c.done).length;
  const progress = Math.round((done / checklist.length) * 100);
  const nextTodo = checklist.find((c) => !c.done);

  const activity = ws.requests
    .flatMap((r) => r.history.map((h) => ({ ...h, request: r })))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Resumen" description="Lo más importante de tu negocio en VIBRA, de un vistazo." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard index={0} icon={Inbox} label="Solicitudes pendientes" value={pending.length} accent={pending.length > 0} hint={pending.length ? "Responde rápido para no perderlas" : "Estás al día"} />
        <KpiCard index={1} icon={CalendarCheck} label="Reservas confirmadas" value={confirmed.length} hint="Próximos eventos" />
        <KpiCard index={2} icon={Wallet} label="Ingresos estimados" value={income} format={(v) => formatBs(v)} hint="De reservas confirmadas" />
        <KpiCard index={3} icon={Eye} label="Visitas al perfil" value={lastMonth?.visits ?? 0} hint={`En ${lastMonth?.month ?? "el último mes"} · demo`} />
        <KpiCard index={4} icon={Star} label="Calificación promedio" value={ws.rating} format={(v) => v.toFixed(1)} hint={`${ws.reviewsCount} reseñas · demo`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-5">
            <ProgressRing value={progress} />
            <div>
              <h2 className="font-general text-lg font-semibold text-white">Tu perfil está al {progress}%</h2>
              <p className="mt-1 text-sm text-ink-mid">
                {progress === 100 ? "Todo listo: tu perfil muestra toda la información que buscan los clientes." : "Los perfiles completos reciben más solicitudes."}
              </p>
            </div>
          </div>
          <ul className="mt-6 flex flex-col gap-1">
            {checklist.map((c) => (
              <li key={c.id}>
                <Link
                  href={c.href}
                  className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                >
                  {c.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-volt" /> : <Circle className="h-5 w-5 shrink-0 text-ink-dark" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", c.done ? "text-ink-light" : "text-white")}>{c.label}</span>
                    {!c.done && <span className="block text-xs text-ink-mid">{c.hint}</span>}
                  </span>
                  <ArrowRight className="h-4 w-4 text-ink-mid opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
          {nextTodo && (
            <Link
              href={nextTodo.href}
              className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-volt/30 bg-volt/[0.07] px-4 py-3 text-sm text-white transition-colors hover:bg-volt/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
            >
              <span>
                Siguiente paso: <strong className="font-semibold">{nextTodo.label.toLowerCase()}</strong>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-volt" />
            </Link>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-general text-lg font-semibold text-white">Próximas reservas</h2>
            <Link href="/panel/calendario" className="text-xs text-volt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
              Ver calendario
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-5">
              <EmptyState icon={CalendarCheck} title="Sin reservas próximas" description="Cuando aceptes solicitudes y los clientes confirmen, aparecerán aquí." />
            </div>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {upcoming.slice(0, 5).map((r, i) => {
                const d = parseDateKey(r.date);
                return (
                  <motion.li key={r.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
                    <Link
                      href={`/panel/solicitudes?id=${r.id}`}
                      className="flex items-center gap-4 rounded-2xl border border-white/[0.06] p-3 transition-colors hover:border-white/15 hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                    >
                      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/[0.04]">
                        <span className="text-[10px] uppercase tracking-wider text-ink-mid">{MONTHS[d.getMonth()].slice(0, 3)}</span>
                        <span className="font-general text-xl font-semibold leading-none text-white">{d.getDate()}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">
                          {r.eventType} · {r.clientName}
                        </span>
                        <span className="block truncate text-xs text-ink-mid">
                          {r.start}–{r.end} · {r.venue}
                        </span>
                      </span>
                      <span className="hidden flex-col items-end gap-1 sm:flex">
                        <StatusBadge status={r.status} />
                        <span className="text-xs text-ink-light">{formatBs(r.counterOffer?.price ?? r.proposedPrice)}</span>
                      </span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-general text-lg font-semibold text-white">Actividad reciente</h2>
          <Link href="/panel/solicitudes" className="text-xs text-volt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
            Ver solicitudes
          </Link>
        </div>
        {activity.length === 0 ? (
          <div className="mt-5">
            <EmptyState icon={ClipboardList} title="Todavía no hay actividad" description="Las solicitudes y sus cambios de estado aparecerán aquí." />
          </div>
        ) : (
          <ol className="relative mt-5 flex flex-col gap-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-white/[0.08]">
            {activity.map((a, i) => (
              <li key={`${a.request.id}-${i}`} className="relative flex gap-4 pl-7">
                <span className="absolute left-0 top-1 h-[15px] w-[15px] rounded-full border-2 border-ink bg-volt/80" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">
                    {a.label} <span className="text-ink-mid">· {a.request.clientName}, {a.request.eventType.toLowerCase()}</span>
                  </p>
                  {a.note && <p className="text-xs text-ink-mid">{a.note}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-mid">{relativeTime(a.at)}</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
