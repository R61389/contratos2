"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Ban, CalendarCheck, CalendarPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, ExternalLink } from "lucide-react";
import type { BookingRequest } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { Card, SectionHeader, StatusBadge } from "@/components/panel/ui/misc";
import { Modal, PanelButton } from "@/components/panel/ui/modal";
import { ChipGroup, Field, MoneyInput, Select, TextInput } from "@/components/panel/ui/fields";
import { dateKey, formatBs, longDate, MONTHS, parseDateKey, uid, WEEKDAYS } from "@/lib/panel/format";
import { dayState, parseAmount, requestDays, toMinutes, type DayState } from "@/lib/panel/logic";
import { addManualBooking } from "@/lib/panel/requests";
import { cn } from "@/lib/utils";

const STATE: Record<DayState, { label: string; cell: string; dot: string }> = {
  disponible: { label: "Disponible", cell: "border-white/[0.08] bg-white/[0.02] hover:border-emerald-400/60", dot: "bg-emerald-400" },
  pendiente: { label: "Pendiente de confirmación", cell: "border-volt/30 bg-volt/[0.07] hover:border-volt/70", dot: "bg-volt" },
  ocupado: { label: "Ocupado", cell: "border-emerald-400/50 bg-emerald-400/15 hover:border-emerald-300", dot: "bg-emerald-300" },
  bloqueada: {
    label: "Fecha bloqueada",
    cell: "border-white/[0.06] bg-[repeating-linear-gradient(135deg,rgba(214,214,214,0.06)_0_6px,transparent_6px_12px)] text-ink-mid hover:border-white/25",
    dot: "bg-ink-mid",
  },
};

const WEEK = ["L", "M", "M", "J", "V", "S", "D"];

/** 24-hour strip with each booking's span and the provider's working hours shaded behind. */
function DayTimeline({ requests, hours }: { requests: BookingRequest[]; hours: { start: string; end: string } }) {
  const pos = (t: string) => (toMinutes(t) / 1440) * 100;
  const hs = pos(hours.start);
  const he = pos(hours.end);
  // Hours that run past midnight shade the evening and the early morning.
  const shaded = he > hs ? [[hs, he]] : [[hs, 100], [0, he]];
  return (
    <div>
      <div className="relative h-10 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]" role="img" aria-label="Franjas horarias del día">
        {shaded.map(([a, b]) => (
          <div key={a} className="absolute inset-y-0 bg-white/[0.06]" style={{ left: `${a}%`, width: `${b - a}%` }} />
        ))}
        {requests.map((r) => {
          const s = pos(r.start);
          let e = pos(r.end);
          if (e <= s) e = 100;
          return (
            <div
              key={r.id}
              title={`${r.clientName}: ${r.start}–${r.end}`}
              className={cn("absolute inset-y-1.5 rounded-md", r.status === "confirmada" ? "bg-emerald-400/80" : "bg-volt/60")}
              style={{ left: `${s}%`, width: `${Math.max(2, e - s)}%` }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-mid">
        {["00", "06", "12", "18", "24"].map((h) => (
          <span key={h}>{h}:00</span>
        ))}
      </div>
    </div>
  );
}

function BookingForm({ date, onClose }: { date: string; onClose: () => void }) {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [f, setF] = useState({ client: "", event: "", serviceId: ws.services[0]?.id ?? "", start: ws.availability.hours.start, end: "", days: "1", venue: "", guests: "", price: "" });
  const [submitted, setSubmitted] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const price = parseAmount(f.price);
  const days = Number(f.days);
  const errors = {
    client: f.client.trim().length < 2 ? "Escribe el nombre del cliente" : null,
    event: f.event.trim().length < 2 ? "Indica el tipo de evento" : null,
    end: !f.end ? "Indica la hora de fin" : f.end === f.start ? "Debe terminar después de empezar" : null,
    days: !Number.isInteger(days) || days < 1 || days > 14 ? "Entre 1 y 14 días" : null,
    price: price.error,
  };
  const service = ws.services.find((s) => s.id === f.serviceId);

  function submit() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const booking: BookingRequest = {
      id: uid("r"),
      clientName: f.client.trim(),
      eventType: f.event.trim(),
      date,
      start: f.start,
      end: f.end,
      days,
      venue: f.venue.trim() || "Por definir",
      guests: f.guests ? Number(f.guests) : null,
      serviceId: service?.id ?? null,
      serviceName: service?.name ?? "Servicio personalizado",
      proposedPrice: price.value ?? 0,
      message: "Reserva registrada manualmente desde el calendario.",
      status: "confirmada",
      source: "manual",
      history: [{ at: new Date().toISOString(), label: "Registraste la reserva desde el calendario" }],
      receivedAt: new Date().toISOString(),
    };
    const blocked = requestDays(booking).find((d) => dayState(ws, d) === "bloqueada");
    if (blocked) {
      toast({ tone: "error", title: "Fecha bloqueada", description: `${longDate(blocked)} está bloqueado. Márcalo como disponible antes de registrar la reserva.` });
      return;
    }
    const error = run((w) => addManualBooking(w, booking));
    if (error) return toast({ tone: "error", title: "Horario ocupado", description: error });
    toast({ tone: "success", title: "Reserva registrada", description: `${booking.clientName} · ${longDate(date)}` });
    onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="lg"
      title="Registrar reserva"
      description={`${longDate(date)} · para reservas acordadas fuera de VIBRA (datos de demostración).`}
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton variant="primary" onClick={submit}>
            Registrar reserva
          </PanelButton>
        </>
      }
    >
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Cliente" htmlFor="bk-client" error={submitted ? errors.client : null}>
          <TextInput id="bk-client" value={f.client} onChange={(e) => set("client", e.target.value)} invalid={submitted && !!errors.client} autoFocus />
        </Field>
        <Field label="Tipo de evento" htmlFor="bk-event" error={submitted ? errors.event : null}>
          <TextInput id="bk-event" value={f.event} onChange={(e) => set("event", e.target.value)} placeholder="Boda, cumpleaños…" invalid={submitted && !!errors.event} />
        </Field>
        <Field label="Servicio" htmlFor="bk-svc" className="sm:col-span-2">
          <Select id="bk-svc" value={f.serviceId} onChange={(e) => set("serviceId", e.target.value)}>
            {ws.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.durationHours} h
              </option>
            ))}
            <option value="">Servicio personalizado</option>
          </Select>
        </Field>
        <div className="grid grid-cols-3 gap-3 sm:col-span-2">
          <Field label="Inicio" htmlFor="bk-start">
            <TextInput id="bk-start" type="time" value={f.start} onChange={(e) => set("start", e.target.value)} className="[color-scheme:dark]" />
          </Field>
          <Field label="Fin" htmlFor="bk-end" error={submitted ? errors.end : null} hint={service ? `Duración del servicio: ${service.durationHours} h` : undefined}>
            <TextInput id="bk-end" type="time" value={f.end} onChange={(e) => set("end", e.target.value)} invalid={submitted && !!errors.end} className="[color-scheme:dark]" />
          </Field>
          <Field label="Días" htmlFor="bk-days" error={submitted ? errors.days : null}>
            <TextInput id="bk-days" inputMode="numeric" value={f.days} onChange={(e) => set("days", e.target.value)} invalid={submitted && !!errors.days} />
          </Field>
        </div>
        <Field label="Lugar" htmlFor="bk-venue">
          <TextInput id="bk-venue" value={f.venue} onChange={(e) => set("venue", e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Invitados" htmlFor="bk-guests">
            <TextInput id="bk-guests" inputMode="numeric" value={f.guests} onChange={(e) => set("guests", e.target.value.replace(/\D/g, ""))} />
          </Field>
          <Field label="Precio" htmlFor="bk-price" error={submitted ? errors.price : null}>
            <MoneyInput id="bk-price" value={f.price} onChange={(e) => set("price", e.target.value)} invalid={submitted && !!errors.price} />
          </Field>
        </div>
        {/* Lets Enter submit; the visible button lives in the dialog footer. */}
        <button type="submit" hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

function AvailabilityCard() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [start, setStart] = useState(ws.availability.hours.start);
  const [end, setEnd] = useState(ws.availability.hours.end);
  const [rest, setRest] = useState(ws.availability.restDays.map(String));
  const error = start === end ? "El horario de inicio y fin no puede ser el mismo" : null;
  return (
    <Card className="p-5">
      <h2 className="font-general text-base font-semibold text-white">Horario y días de descanso</h2>
      <p className="mt-0.5 text-xs text-ink-mid">Si el fin es menor que el inicio, se entiende que trabajas pasada la medianoche.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Desde" htmlFor="av-start">
          <TextInput id="av-start" type="time" value={start} onChange={(e) => setStart(e.target.value)} className="[color-scheme:dark]" />
        </Field>
        <Field label="Hasta" htmlFor="av-end" error={error}>
          <TextInput id="av-end" type="time" value={end} onChange={(e) => setEnd(e.target.value)} invalid={!!error} className="[color-scheme:dark]" />
        </Field>
      </div>
      <Field label="Días de descanso" className="mt-4">
        <ChipGroup
          label="Días de descanso"
          value={rest}
          onChange={setRest}
          options={[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: String(d), label: WEEKDAYS[d][0].toUpperCase() + WEEKDAYS[d].slice(1, 3) }))}
        />
      </Field>
      <PanelButton
        variant="primary"
        size="sm"
        className="mt-4"
        disabled={!!error}
        onClick={() => {
          run((w) => ({ ...w, availability: { ...w.availability, hours: { start, end }, restDays: rest.map(Number), updatedAt: new Date().toISOString() } }));
          toast({ tone: "success", title: "Disponibilidad actualizada" });
        }}
      >
        Guardar horario
      </PanelButton>
    </Card>
  );
}

export function CalendarSection() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const params = useSearchParams();
  const todayKey = dateKey(new Date());
  const [offset, setOffset] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selected, setSelected] = useState<string>(todayKey);
  const [booking, setBooking] = useState(false);
  const [detail, setDetail] = useState<BookingRequest | null>(null);

  // Links from requests arrive with ?fecha=yyyy-mm-dd.
  useEffect(() => {
    const fecha = params.get("fecha");
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return;
    const d = parseDateKey(fecha);
    const now = new Date();
    setSelected(fecha);
    setOffset((d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth());
  }, [params]);

  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lead = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const keys = Array.from({ length: count }, (_, i) => dateKey(new Date(month.getFullYear(), month.getMonth(), i + 1)));

  const onDay = useMemo(
    () => ws.requests.filter((r) => requestDays(r).includes(selected) && r.status !== "rechazada").sort((a, b) => a.start.localeCompare(b.start)),
    [ws.requests, selected]
  );
  const selState = dayState(ws, selected);
  const past = selected < todayKey;
  const isRestDay = ws.availability.restDays.includes(parseDateKey(selected).getDay());

  function go(delta: number) {
    setDirection(delta);
    setOffset((o) => Math.max(-6, Math.min(12, o + delta)));
  }

  function setOverride(kind: "disponible" | "bloqueada") {
    if (kind === "bloqueada" && onDay.some((r) => r.status === "confirmada")) {
      toast({ tone: "error", title: "No se puede bloquear", description: "Ese día tienes una reserva confirmada. Cancélala primero si ya no la harás." });
      return;
    }
    run((w) => ({ ...w, availability: { ...w.availability, overrides: { ...w.availability.overrides, [selected]: kind }, updatedAt: new Date().toISOString() } }));
    toast({ tone: "success", title: kind === "bloqueada" ? "Fecha bloqueada" : "Fecha disponible", description: longDate(selected) });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Calendario y disponibilidad"
        description="Lo que marques aquí define qué fechas pueden pedirte los clientes."
        actions={
          <PanelButton variant="primary" onClick={() => setBooking(true)} disabled={past}>
            <CalendarPlus className="h-4 w-4" /> Registrar reserva
          </PanelButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-general text-xl font-semibold capitalize text-white" aria-live="polite">
              {MONTHS[month.getMonth()]} <span className="text-ink-mid">{month.getFullYear()}</span>
            </h2>
            <div className="flex gap-2">
              <PanelButton size="sm" variant="ghost" onClick={() => {
                  setOffset(0);
                  setSelected(todayKey);
                }}>
                Hoy
              </PanelButton>
              <button type="button" onClick={() => go(-1)} disabled={offset <= -6} aria-label="Mes anterior" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-light hover:border-volt hover:text-volt disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => go(1)} disabled={offset >= 12} aria-label="Mes siguiente" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-light hover:border-volt hover:text-volt disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-mid sm:gap-2">
            {WEEK.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="relative mt-2 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={offset}
                initial={{ opacity: 0, x: direction * 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -40 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-7 gap-1 sm:gap-2"
              >
                {Array.from({ length: lead }, (_, i) => (
                  <span key={`b${i}`} />
                ))}
                {keys.map((k) => {
                  const st = dayState(ws, k);
                  const isPast = k < todayKey;
                  const count = ws.requests.filter((r) => r.status !== "rechazada" && r.status !== "cancelada" && requestDays(r).includes(k)).length;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSelected(k)}
                      aria-pressed={selected === k}
                      aria-label={`${longDate(k)}: ${isPast ? "fecha pasada" : STATE[st].label}${count ? `, ${count} solicitud(es)` : ""}`}
                      className={cn(
                        "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt sm:rounded-2xl",
                        STATE[st].cell,
                        isPast && "opacity-40",
                        selected === k && "ring-2 ring-volt ring-offset-2 ring-offset-ink",
                        k === todayKey && "font-bold text-volt"
                      )}
                    >
                      <span className={cn(st === "bloqueada" ? "text-ink-mid" : k === todayKey ? "text-volt" : "text-white")}>{parseDateKey(k).getDate()}</span>
                      <span className="absolute bottom-1 flex gap-0.5 sm:bottom-1.5">
                        {count > 0 ? Array.from({ length: Math.min(3, count) }, (_, i) => <span key={i} className={cn("h-1 w-1 rounded-full", STATE[st].dot)} />) : <span className={cn("h-1 w-1 rounded-full opacity-60", STATE[st].dot)} />}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4 text-xs text-ink-mid">
            {(Object.keys(STATE) as DayState[]).map((s) => (
              <span key={s} className="flex items-center gap-2">
                <span className={cn("h-3 w-3 rounded border", STATE[s].cell)} />
                {STATE[s].label}
              </span>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <p className="text-xs text-ink-mid">Día seleccionado</p>
                <h2 className="mt-0.5 font-general text-lg font-semibold text-white">{longDate(selected)}</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-ink-light">
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATE[selState].dot)} />
                  {STATE[selState].label}
                  {isRestDay && selState === "bloqueada" && !ws.availability.overrides[selected] && <span className="text-ink-mid">(día de descanso)</span>}
                </p>

                <div className="mt-4">
                  <DayTimeline requests={onDay.filter((r) => r.status !== "cancelada")} hours={ws.availability.hours} />
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-mid">
                    <Clock className="h-3 w-3" /> Tu horario: {ws.availability.hours.start}–{ws.availability.hours.end}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <PanelButton size="sm" onClick={() => setOverride("disponible")} disabled={past || selState === "disponible" || selState === "ocupado"}>
                    <CheckCircle2 className="h-4 w-4" /> Marcar disponible
                  </PanelButton>
                  <PanelButton size="sm" onClick={() => setOverride("bloqueada")} disabled={past || selState === "bloqueada"}>
                    <Ban className="h-4 w-4" /> Bloquear fecha
                  </PanelButton>
                  <PanelButton size="sm" variant="outline" onClick={() => setBooking(true)} disabled={past}>
                    <CalendarPlus className="h-4 w-4" /> Registrar reserva
                  </PanelButton>
                </div>

                <div className="mt-5 border-t border-white/[0.06] pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-mid">Solicitudes y reservas</p>
                  {onDay.length === 0 ? (
                    <p className="mt-3 text-sm text-ink-mid">Nada agendado para este día.</p>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {onDay.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => setDetail(r)}
                            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] p-3 text-left transition-colors hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                          >
                            <span className="w-24 shrink-0 text-xs tabular-nums text-ink-light">
                              {r.start}–{r.end}
                              {r.days > 1 && <span className="block text-ink-mid">{r.days} días</span>}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-white">{r.clientName}</span>
                              <span className="block truncate text-xs text-ink-mid">{r.eventType}</span>
                            </span>
                            <StatusBadge status={r.status} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
          <AvailabilityCard key={ws.id} />
        </div>
      </div>

      {booking && <BookingForm date={selected} onClose={() => setBooking(false)} />}
      <Modal open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail ? `${detail.clientName} · ${detail.eventType}` : ""} description={detail ? longDate(detail.date) : undefined}>
        {detail && (
          <div className="flex flex-col gap-4">
            <StatusBadge status={detail.status} />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Horario", `${detail.start}–${detail.end}${detail.days > 1 ? ` · ${detail.days} días` : ""}`],
                ["Lugar", detail.venue],
                ["Servicio", detail.serviceName],
                ["Precio", formatBs(detail.counterOffer?.price ?? detail.proposedPrice)],
                ["Invitados", detail.guests ?? "—"],
                ["Origen", detail.source === "manual" ? "Registrada por ti" : "Solicitud en VIBRA"],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="text-xs text-ink-mid">{k}</dt>
                  <dd className="text-white">{v}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/panel/solicitudes?id=${detail.id}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 text-sm text-ink-light hover:border-volt/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
            >
              {detail.status === "confirmada" ? <CalendarCheck className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
              Gestionar en Solicitudes
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
