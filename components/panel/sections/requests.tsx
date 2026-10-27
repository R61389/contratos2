"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarDays,
  Check,
  Clock,
  HandCoins,
  Inbox,
  MapPin,
  MessageSquareText,
  PenLine,
  Search,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import type { BookingRequest, RequestStatus } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { ActionMenu, Card, DemoNote, EmptyState, SectionHeader, StatusBadge } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { Field, MoneyInput, TextArea } from "@/components/panel/ui/fields";
import { formatBs, longDate, relativeTime } from "@/lib/panel/format";
import { parseAmount } from "@/lib/panel/logic";
import {
  acceptRequest,
  cancelBooking,
  proposePrice,
  registerClientConfirmation,
  rejectRequest,
  requestChanges,
  type Result,
} from "@/lib/panel/requests";
import { cn } from "@/lib/utils";

const FILTERS: { id: "todas" | RequestStatus; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "pendiente", label: "Pendientes" },
  { id: "modificacion", label: "En negociación" },
  { id: "aceptada", label: "Aceptadas" },
  { id: "confirmada", label: "Confirmadas" },
  { id: "rechazada", label: "Rechazadas" },
  { id: "cancelada", label: "Canceladas" },
];

type Dialog =
  | { kind: "accept" | "reject" | "price" | "changes" | "confirm" | "cancel"; id: string }
  | null;

const REJECT_REASONS = ["Fecha ya comprometida", "Fuera de mi zona de servicio", "El presupuesto no alcanza", "No ofrezco ese servicio"];

/** Runs a status change for the active provider and reports the outcome. */
function useRequestAction() {
  const { run } = usePanel();
  const toast = useToast();
  return (change: (ws: Parameters<Parameters<typeof run>[0]>[0]) => Result, success: { title: string; description?: string }) => {
    const error = run(change);
    if (error) toast({ tone: "error", title: "No se pudo completar", description: error });
    else toast({ tone: "success", ...success });
    return !error;
  };
}

function actionsFor(status: RequestStatus) {
  return {
    accept: status === "pendiente" || status === "modificacion",
    reject: status === "pendiente" || status === "modificacion" || status === "aceptada",
    price: status === "pendiente" || status === "modificacion" || status === "aceptada",
    changes: status === "pendiente" || status === "modificacion" || status === "aceptada",
    confirm: status === "aceptada",
    cancel: status === "aceptada" || status === "confirmada",
  };
}

function RequestCard({ r, onOpen, onDialog }: { r: BookingRequest; onOpen: () => void; onDialog: (d: Dialog) => void }) {
  const a = actionsFor(r.status);
  const router = useRouter();
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="group p-4 transition-colors hover:border-white/15 sm:p-5">
        <div className="flex items-start gap-4">
          <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt rounded-lg" aria-label={`Ver detalles de la solicitud de ${r.clientName}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-general text-base font-semibold text-white">{r.clientName}</span>
              <span className="text-ink-mid">·</span>
              <span className="text-sm text-ink-light">{r.eventType}</span>
              <StatusBadge status={r.status} />
              {r.source === "manual" && <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-ink-mid">Registrada por ti</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-mid">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {longDate(r.date)}
                {r.days > 1 && ` (${r.days} días)`}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {r.start}–{r.end}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {r.venue}
              </span>
              {r.guests !== null && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {r.guests} invitados
                </span>
              )}
            </div>
            <p className="mt-3 line-clamp-2 text-sm text-ink-light">“{r.message}”</p>
          </button>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="text-right">
              <span className="block font-general text-lg font-semibold text-white">{formatBs(r.counterOffer?.price ?? r.proposedPrice)}</span>
              <span className="block text-[11px] text-ink-mid">{r.counterOffer ? `Tu propuesta · pidió ${formatBs(r.proposedPrice)}` : r.serviceName}</span>
            </span>
            <ActionMenu
              label={`Acciones para la solicitud de ${r.clientName}`}
              items={[
                { label: "Consultar detalles", icon: MessageSquareText, onSelect: onOpen },
                { label: "Ver en el calendario", icon: CalendarDays, onSelect: () => router.push(`/panel/calendario?fecha=${r.date}`) },
                ...(a.price ? [{ label: "Proponer otro precio", icon: HandCoins, onSelect: () => onDialog({ kind: "price", id: r.id }) }] : []),
                ...(a.changes ? [{ label: "Solicitar cambios", icon: PenLine, onSelect: () => onDialog({ kind: "changes", id: r.id }) }] : []),
                ...(a.confirm ? [{ label: "Registrar confirmación del cliente", icon: UserCheck, onSelect: () => onDialog({ kind: "confirm", id: r.id }) }] : []),
                ...(a.cancel || a.reject ? (["separator"] as const) : []),
                ...(a.reject && r.status !== "aceptada" ? [{ label: "Rechazar", icon: XCircle, danger: true, onSelect: () => onDialog({ kind: "reject", id: r.id }) }] : []),
                ...(a.cancel ? [{ label: r.status === "confirmada" ? "Cancelar reserva" : "Cancelar", icon: XCircle, danger: true, onSelect: () => onDialog({ kind: "cancel", id: r.id }) }] : []),
              ]}
            />
          </div>
        </div>
        {(a.accept || a.confirm) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            {a.accept && (
              <PanelButton size="sm" variant="primary" onClick={() => onDialog({ kind: "accept", id: r.id })}>
                <Check className="h-4 w-4" />
                Aceptar
              </PanelButton>
            )}
            {a.confirm && (
              <PanelButton size="sm" variant="outline" onClick={() => onDialog({ kind: "confirm", id: r.id })}>
                <UserCheck className="h-4 w-4" />
                Registrar confirmación del cliente
              </PanelButton>
            )}
            {a.price && (
              <PanelButton size="sm" onClick={() => onDialog({ kind: "price", id: r.id })}>
                <HandCoins className="h-4 w-4" />
                Proponer precio
              </PanelButton>
            )}
            {a.accept && (
              <PanelButton size="sm" variant="ghost" onClick={() => onDialog({ kind: "reject", id: r.id })}>
                <X className="h-4 w-4" />
                Rechazar
              </PanelButton>
            )}
          </div>
        )}
      </Card>
    </motion.li>
  );
}

function Detail({ r, onDialog }: { r: BookingRequest; onDialog: (d: Dialog) => void }) {
  const a = actionsFor(r.status);
  const rows: [string, React.ReactNode][] = [
    ["Tipo de evento", r.eventType],
    ["Fecha", `${longDate(r.date)}${r.days > 1 ? ` · ${r.days} días` : ""}`],
    ["Horario", `${r.start} – ${r.end}`],
    ["Lugar", r.venue],
    ["Invitados", r.guests ?? "No aplica"],
    ["Servicio", r.serviceName],
    ["Precio solicitado", formatBs(r.proposedPrice)],
    ["Recibida", relativeTime(r.receivedAt)],
  ];
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={r.status} />
        {r.status === "aceptada" && <span className="text-xs text-ink-mid">Aún no es una reserva: falta que el cliente confirme.</span>}
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-ink-mid">{k}</dt>
            <dd className="text-sm text-white">{v}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="text-xs text-ink-mid">Mensaje del cliente</p>
        <p className="mt-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm leading-relaxed text-ink-light">“{r.message}”</p>
      </div>
      {r.counterOffer && (
        <div className="rounded-2xl border border-sky-300/30 bg-sky-300/[0.06] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-200">Tu propuesta</p>
          <p className="mt-1 font-general text-2xl font-semibold text-white">{formatBs(r.counterOffer.price)}</p>
          {r.counterOffer.conditions && <p className="mt-2 text-sm text-ink-light">Condiciones: {r.counterOffer.conditions}</p>}
          {r.counterOffer.message && <p className="mt-1 text-sm text-ink-mid">“{r.counterOffer.message}”</p>}
        </div>
      )}
      {r.changeRequest && (
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-mid">Cambios solicitados</p>
          <p className="mt-1 text-sm text-ink-light">{r.changeRequest}</p>
        </div>
      )}
      {r.rejectReason && r.status === "rechazada" && <p className="text-sm text-ink-mid">Motivo del rechazo: {r.rejectReason}</p>}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-mid">Historial</p>
        <ol className="mt-3 flex flex-col gap-3 border-l border-white/10 pl-4">
          {r.history.map((h, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-volt" />
              <p className="text-sm text-white">{h.label}</p>
              <p className="text-xs text-ink-mid">
                {relativeTime(h.at)}
                {h.note ? ` · ${h.note}` : ""}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
        {a.accept && (
          <PanelButton variant="primary" onClick={() => onDialog({ kind: "accept", id: r.id })}>
            <Check className="h-4 w-4" /> Aceptar solicitud
          </PanelButton>
        )}
        {a.confirm && (
          <PanelButton variant="outline" onClick={() => onDialog({ kind: "confirm", id: r.id })}>
            <UserCheck className="h-4 w-4" /> Registrar confirmación del cliente
          </PanelButton>
        )}
        {a.price && (
          <PanelButton onClick={() => onDialog({ kind: "price", id: r.id })}>
            <HandCoins className="h-4 w-4" /> Proponer otro precio
          </PanelButton>
        )}
        {a.changes && (
          <PanelButton onClick={() => onDialog({ kind: "changes", id: r.id })}>
            <PenLine className="h-4 w-4" /> Solicitar cambios
          </PanelButton>
        )}
        <Link
          href={`/panel/calendario?fecha=${r.date}`}
          className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm text-ink-light hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
        >
          <CalendarDays className="h-4 w-4" /> Ver en el calendario
        </Link>
        {a.reject && r.status !== "aceptada" && (
          <PanelButton variant="ghost" className="text-red-300" onClick={() => onDialog({ kind: "reject", id: r.id })}>
            <XCircle className="h-4 w-4" /> Rechazar
          </PanelButton>
        )}
        {a.cancel && (
          <PanelButton variant="ghost" className="text-red-300" onClick={() => onDialog({ kind: "cancel", id: r.id })}>
            <XCircle className="h-4 w-4" /> {r.status === "confirmada" ? "Cancelar reserva" : "Cancelar"}
          </PanelButton>
        )}
      </div>
    </div>
  );
}

function PriceDialog({ r, onClose }: { r: BookingRequest; onClose: () => void }) {
  const act = useRequestAction();
  const [amount, setAmount] = useState(String(r.counterOffer?.price ?? r.proposedPrice));
  const [conditions, setConditions] = useState(r.counterOffer?.conditions ?? "");
  const [message, setMessage] = useState(r.counterOffer?.message ?? "");
  const [touched, setTouched] = useState(false);
  const parsed = parseAmount(amount);
  const error = parsed.error ?? (parsed.value === 0 ? "El precio debe ser mayor a cero" : null);

  function submit() {
    setTouched(true);
    if (error || parsed.value === null) return;
    const price = parsed.value;
    if (act((ws) => proposePrice(ws, r.id, { price, conditions: conditions.trim(), message: message.trim() }), { title: "Propuesta enviada", description: `Ofreciste ${formatBs(price)} a ${r.clientName}.` })) onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Proponer otro precio"
      description={`${r.clientName} propuso ${formatBs(r.proposedPrice)} para ${r.eventType.toLowerCase()}.`}
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton variant="primary" onClick={submit}>
            Enviar propuesta
          </PanelButton>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Nuevo importe" htmlFor="counter-price" error={touched ? error : null} hint="En bolivianos. Ejemplo: 3.800">
          <MoneyInput id="counter-price" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={() => setTouched(true)} invalid={touched && !!error} autoFocus />
        </Field>
        <Field label="Condiciones" htmlFor="counter-cond" hint="Opcional. Qué incluye este precio o qué cambia.">
          <TextArea id="counter-cond" value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="Incluye una hora extra y la iluminación del escenario." />
        </Field>
        <Field label="Mensaje para el cliente" htmlFor="counter-msg">
          <TextArea id="counter-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="¡Hola! Te propongo este precio porque…" />
        </Field>
        {/* Lets Enter submit; the visible button lives in the dialog footer. */}
        <button type="submit" hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

function TextDialog({
  r,
  onClose,
  kind,
}: {
  r: BookingRequest;
  onClose: () => void;
  kind: "reject" | "changes" | "cancel";
}) {
  const act = useRequestAction();
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const required = kind === "changes";
  const error = required && !text.trim() ? "Describe qué cambios necesitas" : null;
  const copy = {
    reject: { title: "Rechazar solicitud", label: "Motivo (opcional)", button: "Rechazar solicitud", hint: "Se lo mostraremos al cliente con amabilidad." },
    changes: { title: "Solicitar cambios", label: "¿Qué necesitas que cambie?", button: "Enviar solicitud de cambios", hint: "Por ejemplo, el horario, el lugar o la cantidad de invitados." },
    cancel: { title: r.status === "confirmada" ? "Cancelar reserva confirmada" : "Cancelar solicitud aceptada", label: "Motivo (opcional)", button: "Cancelar", hint: "La fecha quedará libre en tu calendario." },
  }[kind];

  function submit() {
    setTouched(true);
    if (error) return;
    const t = text.trim();
    const ok =
      kind === "reject"
        ? act((ws) => rejectRequest(ws, r.id, t), { title: "Solicitud rechazada", description: `Avisaremos a ${r.clientName}.` })
        : kind === "changes"
          ? act((ws) => requestChanges(ws, r.id, t), { title: "Cambios solicitados", description: `${r.clientName} verá tu pedido.` })
          : act((ws) => cancelBooking(ws, r.id, t), { title: "Reserva cancelada", description: "La fecha quedó libre." });
    if (ok) onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title={copy.title}
      description={`${r.clientName} · ${r.eventType} · ${longDate(r.date)}`}
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Volver
          </PanelButton>
          <PanelButton variant={kind === "changes" ? "primary" : "danger"} onClick={submit}>
            {copy.button}
          </PanelButton>
        </>
      }
    >
      {kind === "reject" && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Motivos frecuentes">
          {REJECT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setText(reason)}
              aria-pressed={text === reason}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
                text === reason ? "border-volt bg-volt/15 text-white" : "border-white/10 text-ink-light hover:border-white/25"
              )}
            >
              {reason}
            </button>
          ))}
        </div>
      )}
      <Field label={copy.label} htmlFor="req-text" hint={copy.hint} error={touched ? error : null}>
        <TextArea id="req-text" value={text} onChange={(e) => setText(e.target.value)} invalid={touched && !!error} autoFocus />
      </Field>
    </Modal>
  );
}

export function Requests() {
  const { ws } = usePanel();
  const act = useRequestAction();
  const params = useSearchParams();
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("todas");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

  // Notifications and the overview link here with ?id= to open a request directly.
  useEffect(() => {
    const id = params.get("id");
    if (id && ws.requests.some((r) => r.id === id)) setOpenId(id);
  }, [params, ws.requests]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: ws.requests.length };
    ws.requests.forEach((r) => (c[r.status] = (c[r.status] ?? 0) + 1));
    return c;
  }, [ws.requests]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const order: Record<RequestStatus, number> = { pendiente: 0, modificacion: 1, aceptada: 2, confirmada: 3, rechazada: 4, cancelada: 5 };
    return ws.requests
      .filter((r) => filter === "todas" || r.status === filter)
      .filter((r) => !q || [r.clientName, r.eventType, r.venue, r.serviceName].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => order[a.status] - order[b.status] || a.date.localeCompare(b.date));
  }, [ws.requests, filter, query]);

  const open = ws.requests.find((r) => r.id === openId) ?? null;
  const target = dialog ? ws.requests.find((r) => r.id === dialog.id) ?? null : null;

  function closeDetail() {
    setOpenId(null);
    if (params.get("id")) router.replace("/panel/solicitudes", { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Solicitudes de reserva" description="Responde a los clientes, negocia condiciones y lleva cada solicitud hasta una reserva confirmada." />

      <DemoNote>
        <strong className="text-ink-light">Aceptar no es reservar.</strong> Al aceptar, el cliente recibe tu respuesta; la fecha queda ocupada recién cuando él confirma.
        En esta demo puedes simular ese paso con “Registrar confirmación del cliente”.
      </DemoNote>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:px-0" role="tablist" aria-label="Filtrar por estado">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "relative shrink-0 rounded-full px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
                filter === f.id ? "text-ink" : "text-ink-light hover:text-white"
              )}
            >
              {filter === f.id && <motion.span layoutId="req-filter" className="absolute inset-0 rounded-full bg-volt" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <span className="relative">
                {f.label} <span className={filter === f.id ? "text-ink/60" : "text-ink-mid"}>{counts[f.id] ?? 0}</span>
              </span>
            </button>
          ))}
        </div>
        <label className="relative lg:w-72">
          <span className="sr-only">Buscar solicitudes</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mid" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, evento o lugar"
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-ink-mid focus:outline-none focus-visible:ring-2 focus-visible:ring-volt"
          />
        </label>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={ws.requests.length === 0 ? "Aún no recibiste solicitudes" : "Nada por aquí"}
          description={ws.requests.length === 0 ? "Cuando un cliente te escriba desde VIBRA, verás su solicitud en esta lista." : "No hay solicitudes con este filtro o búsqueda."}
          action={
            (filter !== "todas" || query) && (
              <PanelButton
                size="sm"
                onClick={() => {
                  setFilter("todas");
                  setQuery("");
                }}
              >
                Ver todas
              </PanelButton>
            )
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false} mode="popLayout">
            {list.map((r) => (
              <RequestCard key={r.id} r={r} onOpen={() => setOpenId(r.id)} onDialog={setDialog} />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Modal open={!!open} onOpenChange={(o) => !o && closeDetail()} variant="sheet" title={open ? `${open.clientName} · ${open.eventType}` : ""} description={open ? `Solicitud por ${open.serviceName}` : undefined}>
        {open && <Detail r={open} onDialog={setDialog} />}
      </Modal>

      {target && dialog?.kind === "price" && <PriceDialog r={target} onClose={() => setDialog(null)} />}
      {target && (dialog?.kind === "reject" || dialog?.kind === "changes" || dialog?.kind === "cancel") && <TextDialog r={target} kind={dialog.kind} onClose={() => setDialog(null)} />}
      <ConfirmDialog
        open={!!target && dialog?.kind === "accept"}
        onOpenChange={(o) => !o && setDialog(null)}
        tone="primary"
        title="¿Aceptar esta solicitud?"
        confirmLabel="Aceptar solicitud"
        description={target ? `${target.clientName} · ${target.eventType} · ${longDate(target.date)}, ${target.start}–${target.end}` : undefined}
        onConfirm={() => target && act((w) => acceptRequest(w, target.id), { title: "Solicitud aceptada", description: `Le avisaremos a ${target.clientName}. La fecha se ocupa cuando confirme.` })}
      >
        <p className="text-sm text-ink-light">
          Le confirmas al cliente que puedes hacer su evento por <strong className="text-white">{target ? formatBs(target.counterOffer?.price ?? target.proposedPrice) : ""}</strong>. Todavía no es una
          reserva definitiva: la fecha se bloquea cuando el cliente confirme.
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={!!target && dialog?.kind === "confirm"}
        onOpenChange={(o) => !o && setDialog(null)}
        tone="primary"
        title="Registrar confirmación del cliente"
        confirmLabel="Confirmar reserva"
        onConfirm={() => target && act((w) => registerClientConfirmation(w, target.id), { title: "¡Reserva confirmada!", description: `${longDate(target.date)} quedó ocupado en tu calendario.` })}
      >
        <p className="text-sm text-ink-light">
          Simula que {target?.clientName} confirmó desde su cuenta. La solicitud pasa a <strong className="text-white">reserva confirmada</strong> y bloquea el horario; si choca
          con otra reserva confirmada, no se podrá confirmar.
        </p>
      </ConfirmDialog>
    </div>
  );
}
