"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarRange, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import type { Promotion } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { ActionMenu, Card, EmptyState, SectionHeader } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { ChipGroup, Field, MoneyInput, Select, Switch, TextArea, TextInput } from "@/components/panel/ui/fields";
import { dateKey, formatBs, PRICING_SUFFIX, shortDate, uid } from "@/lib/panel/format";
import { isPromoLive, parseAmount, promoPrice } from "@/lib/panel/logic";
import { cn } from "@/lib/utils";

type Draft = Omit<Promotion, "value"> & { value: string };

function phase(p: Promotion) {
  const today = dateKey(new Date());
  if (!p.active) return { label: "Inactiva", style: "border-white/10 text-ink-mid" };
  if (today < p.start) return { label: "Programada", style: "border-sky-300/40 text-sky-200" };
  if (today > p.end) return { label: "Vencida", style: "border-red-300/40 text-red-200" };
  return { label: "Activa ahora", style: "border-volt bg-volt text-ink" };
}

function PromoBanner({ name, description, type, value }: { name: string; description: string; type: Promotion["type"]; value: number | null }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      className="relative overflow-hidden rounded-3xl border border-volt/50 bg-[#151600] p-6 shadow-[0_0_60px_-12px_rgba(226,232,0,0.55)]"
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-volt/25 blur-3xl" />
      <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-volt">Promoción</p>
      <p className="relative mt-3 font-general text-6xl font-bold leading-none text-volt">
        {value === null ? "—" : type === "porcentaje" ? `${value}%` : formatBs(value)}
        <span className="ml-2 align-top text-2xl text-white">OFF</span>
      </p>
      <p className="relative mt-4 font-general text-lg font-semibold text-white">{name || "Nombre de la promoción"}</p>
      <p className="relative mt-1 text-sm text-ink-light/80">{description || "Describe a quién está dirigida."}</p>
    </motion.div>
  );
}

function PromoForm({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [d, setD] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const amount = parseAmount(d.value);
  const priced = ws.services.filter((s) => d.serviceIds.includes(s.id) && s.basePrice !== null && s.pricingMode !== "cotizacion");
  const tooBig = amount.value !== null ? priced.find((s) => promoPrice(s.basePrice!, { type: d.type, value: amount.value! }).invalid) : undefined;
  const errors = {
    name: d.name.trim().length < 3 ? "Ponle un nombre de al menos 3 letras" : null,
    value:
      amount.error ??
      (!amount.value ? "El descuento debe ser mayor a cero" : d.type === "porcentaje" && amount.value >= 100 ? "Debe ser menor a 100 %" : tooBig ? `Dejaría “${tooBig.name}” en Bs 0 o menos` : null),
    dates: !d.start || !d.end ? "Indica las dos fechas" : d.start > d.end ? "La fecha de inicio debe ser anterior a la de fin" : null,
    services: d.serviceIds.length === 0 ? "Elige al menos un servicio" : null,
  };

  function save() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const promo: Promotion = { ...d, id: d.id || uid("pr"), name: d.name.trim(), description: d.description.trim(), conditions: d.conditions.trim(), value: amount.value ?? 0 };
    const exists = ws.promotions.some((p) => p.id === promo.id);
    run((w) => ({ ...w, promotions: exists ? w.promotions.map((p) => (p.id === promo.id ? promo : p)) : [promo, ...w.promotions] }));
    toast({ tone: "success", title: exists ? "Promoción actualizada" : "Promoción creada", description: promo.active ? "Se verá en tu perfil durante su vigencia." : "Quedó inactiva." });
    onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title={initial.id ? "Editar promoción" : "Nueva promoción"}
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton variant="primary" onClick={save}>
            Guardar promoción
          </PanelButton>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Nombre de la promoción" htmlFor="po-name" error={submitted ? errors.name : null}>
            <TextInput id="po-name" value={d.name} onChange={(e) => set("name", e.target.value)} invalid={submitted && !!errors.name} placeholder="Eventos corporativos" autoFocus />
          </Field>
          <Field label="Descripción" htmlFor="po-desc">
            <TextArea id="po-desc" value={d.description} onChange={(e) => set("description", e.target.value)} className="min-h-[72px]" placeholder="Para empresas e instituciones." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de descuento" htmlFor="po-type">
              <Select id="po-type" value={d.type} onChange={(e) => set("type", e.target.value as Promotion["type"])}>
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="monto">Importe fijo (Bs)</option>
              </Select>
            </Field>
            <Field label={d.type === "porcentaje" ? "Porcentaje" : "Importe"} htmlFor="po-value" error={submitted ? errors.value : null}>
              {d.type === "porcentaje" ? (
                <TextInput id="po-value" inputMode="decimal" value={d.value} onChange={(e) => set("value", e.target.value)} invalid={submitted && !!errors.value} placeholder="15" />
              ) : (
                <MoneyInput id="po-value" value={d.value} onChange={(e) => set("value", e.target.value)} invalid={submitted && !!errors.value} />
              )}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio" htmlFor="po-start" error={submitted ? errors.dates : null}>
              <TextInput id="po-start" type="date" value={d.start} onChange={(e) => set("start", e.target.value)} className="[color-scheme:dark]" />
            </Field>
            <Field label="Fin" htmlFor="po-end">
              <TextInput id="po-end" type="date" value={d.end} onChange={(e) => set("end", e.target.value)} className="[color-scheme:dark]" />
            </Field>
          </div>
          <Field label="Servicios en los que aplica" error={submitted ? errors.services : null}>
            <ChipGroup label="Servicios aplicables" value={d.serviceIds} onChange={(v) => set("serviceIds", v)} options={ws.services.map((s) => ({ value: s.id, label: s.name }))} />
          </Field>
          <Field label="Condiciones" htmlFor="po-cond">
            <TextArea id="po-cond" value={d.conditions} onChange={(e) => set("conditions", e.target.value)} className="min-h-[64px]" placeholder="Válido de lunes a jueves." />
          </Field>
          <Switch checked={d.active} onChange={(v) => set("active", v)} label="Promoción activa" description="Si está inactiva, no se muestra aunque esté en fecha." />
          {/* Lets Enter submit; the visible button lives in the dialog footer. */}
        <button type="submit" hidden tabIndex={-1} />
        </form>

        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-mid">Vista previa en tu perfil</p>
          <PromoBanner name={d.name} description={d.description} type={d.type} value={amount.value} />
          {priced.length > 0 && amount.value !== null && (
            <ul className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] p-4 text-sm">
              {priced.map((s) => {
                const r = promoPrice(s.basePrice!, { type: d.type, value: amount.value! });
                return (
                  <li key={s.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-ink-light">{s.name}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="text-xs text-ink-mid line-through">{formatBs(s.basePrice!)}</span>{" "}
                      <span className={cn("font-semibold", r.invalid ? "text-red-300" : "text-volt")}>{formatBs(r.final)}</span>{" "}
                      <span className="text-xs text-ink-mid">{PRICING_SUFFIX[s.pricingMode]}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function Promotions() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Promotion | null>(null);
  const today = dateKey(new Date());
  const later = dateKey(new Date(Date.now() + 30 * 86400_000));
  const blank: Draft = { id: "", name: "", description: "", type: "porcentaje", value: "", start: today, end: later, serviceIds: ws.services.filter((s) => s.status === "publicado").map((s) => s.id), conditions: "", active: true };
  const live = ws.promotions.find((p) => isPromoLive(p));

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Promociones y descuentos"
        description="Ofertas con fecha de inicio y fin que se destacan en tu perfil."
        actions={
          <PanelButton variant="primary" onClick={() => setEditing(blank)} disabled={!ws.services.length}>
            <Plus className="h-4 w-4" /> Nueva promoción
          </PanelButton>
        }
      />

      {live && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <PromoBanner name={live.name} description={live.description} type={live.type} value={live.value} />
          <p className="text-sm text-ink-mid">
            <span className="text-white">Así ven hoy los clientes tu promoción activa.</span> Se muestra arriba de tus servicios y aplica el descuento a los precios de los servicios elegidos,
            sin dejarlos nunca por debajo de cero.
          </p>
        </div>
      )}

      {ws.promotions.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="Sin promociones"
          description={ws.services.length ? "Una promoción con fecha límite es la forma más rápida de llenar días entre semana." : "Primero crea un servicio para poder aplicarle una promoción."}
          action={
            ws.services.length ? (
              <PanelButton variant="primary" size="sm" onClick={() => setEditing(blank)}>
                <Plus className="h-4 w-4" /> Crear promoción
              </PanelButton>
            ) : undefined
          }
        />
      ) : (
        <motion.ul layout className="grid gap-4 md:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {ws.promotions.map((p) => {
              const ph = phase(p);
              return (
                <motion.li key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
                  <Card className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-volt/10 px-2 font-general text-sm font-bold text-volt">
                          {p.type === "porcentaje" ? `−${p.value}%` : `−${formatBs(p.value)}`}
                        </span>
                        <div>
                          <p className="font-medium text-white">{p.name}</p>
                          <p className="text-xs text-ink-mid">{p.description}</p>
                        </div>
                      </div>
                      <ActionMenu
                        label={`Acciones de ${p.name}`}
                        items={[
                          { label: "Editar", icon: Pencil, onSelect: () => setEditing({ ...p, value: String(p.value) }) },
                          "separator",
                          { label: "Eliminar", icon: Trash2, danger: true, onSelect: () => setDeleting(p) },
                        ]}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className={cn("rounded-full border px-2.5 py-0.5 font-semibold", ph.style)}>{ph.label}</span>
                      <span className="flex items-center gap-1 text-ink-mid">
                        <CalendarRange className="h-3.5 w-3.5" /> {shortDate(p.start)} – {shortDate(p.end)}
                      </span>
                    </div>
                    <p className="text-xs text-ink-mid">
                      Aplica a: {p.serviceIds.map((id) => ws.services.find((s) => s.id === id)?.name).filter(Boolean).join(", ") || "ningún servicio"}
                    </p>
                    <div className="mt-auto border-t border-white/[0.06] pt-3">
                      <Switch
                        checked={p.active}
                        onChange={(v) => {
                          run((w) => ({ ...w, promotions: w.promotions.map((x) => (x.id === p.id ? { ...x, active: v } : x)) }));
                          toast({ tone: "success", title: v ? "Promoción activada" : "Promoción desactivada", description: p.name });
                        }}
                        label={p.active ? "Activa" : "Inactiva"}
                      />
                    </div>
                  </Card>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </motion.ul>
      )}

      {editing && <PromoForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar esta promoción?"
        description={deleting?.name}
        onConfirm={() => {
          if (!deleting) return;
          run((w) => ({ ...w, promotions: w.promotions.filter((p) => p.id !== deleting.id) }));
          toast({ tone: "success", title: "Promoción eliminada" });
        }}
      />
    </div>
  );
}
