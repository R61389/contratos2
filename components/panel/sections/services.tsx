"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Clock, Copy, Eye, EyeOff, ImagePlus, Pencil, Plus, Store, Trash2, Upload, Users } from "lucide-react";
import type { PricingMode, ProviderKind, Service } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { ActionMenu, Card, EmptyState, SectionHeader, Thumb } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { Field, ListEditor, MoneyInput, Select, TextArea, TextInput } from "@/components/panel/ui/fields";
import { PublicPreview } from "@/components/panel/public-preview";
import { KIND_LABEL, PRICING_BY_KIND, PRICING_LABEL, priceLabel, uid } from "@/lib/panel/format";
import { parseAmount } from "@/lib/panel/logic";
import { ACCEPT_ATTR, intakeFiles } from "@/lib/panel/media";
import { cn } from "@/lib/utils";

type Draft = Omit<Service, "basePrice" | "durationHours"> & { basePrice: string; durationHours: string };

function toDraft(s: Service): Draft {
  return { ...s, basePrice: s.basePrice === null ? "" : String(s.basePrice), durationHours: String(s.durationHours) };
}

function emptyDraft(kind: ProviderKind): Draft {
  return {
    id: "",
    name: "",
    category: kind,
    description: "",
    coverId: null,
    galleryIds: [],
    basePrice: "",
    pricingMode: PRICING_BY_KIND[kind][0],
    durationHours: "4",
    includes: [],
    excludes: [],
    capacity: "",
    conditions: "",
    status: "borrador",
    updatedAt: "",
  };
}

function validate(d: Draft) {
  const errors: Partial<Record<"name" | "description" | "basePrice" | "durationHours", string>> = {};
  if (d.name.trim().length < 3) errors.name = "Escribe un nombre de al menos 3 letras";
  if (d.description.trim().length < 20) errors.description = "Describe el servicio en al menos 20 caracteres";
  if (d.pricingMode !== "cotizacion") {
    const { value, error } = parseAmount(d.basePrice);
    if (error) errors.basePrice = error;
    else if (!value) errors.basePrice = "El precio debe ser mayor a cero";
  }
  const hours = Number(d.durationHours.replace(",", "."));
  if (!Number.isFinite(hours) || hours <= 0) errors.durationHours = "Indica una duración mayor a cero";
  else if (hours > 72) errors.durationHours = "Para más de 72 horas, usa varios días en el calendario";
  return errors;
}

function ServiceForm({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [d, setD] = useState<Draft>(initial);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const errors = validate(d);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] : undefined);
  const modes = PRICING_BY_KIND[d.category];
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const cover = ws.media.find((m) => m.id === d.coverId) ?? null;

  function uploadCover(files: FileList | null) {
    if (!files?.length) return;
    const { accepted, errors: fileErrors } = intakeFiles([files[0]]);
    fileErrors.forEach((e) => toast({ tone: "error", title: "Imagen no válida", description: e }));
    if (!accepted.length) return;
    const item = accepted[0];
    run((w) => ({ ...w, media: [...w.media, item], galleryOrder: [...w.galleryOrder, item.id] }));
    set("coverId", item.id);
    toast({ tone: "info", title: "Portada agregada", description: "También quedó en tu galería. Es una vista previa local." });
  }

  function save(status?: Service["status"]) {
    setSubmitted(true);
    if (Object.keys(errors).length) {
      toast({ tone: "error", title: "Revisa el formulario", description: "Hay campos con datos inválidos." });
      return;
    }
    const service: Service = {
      ...d,
      id: d.id || uid("s"),
      name: d.name.trim(),
      description: d.description.trim(),
      basePrice: d.pricingMode === "cotizacion" ? null : parseAmount(d.basePrice).value,
      durationHours: Number(d.durationHours.replace(",", ".")),
      status: status ?? d.status,
      updatedAt: new Date().toISOString(),
    };
    const exists = ws.services.some((s) => s.id === service.id);
    run((w) => ({ ...w, services: exists ? w.services.map((s) => (s.id === service.id ? service : s)) : [service, ...w.services] }));
    toast({ tone: "success", title: exists ? "Servicio actualizado" : "Servicio creado", description: service.status === "publicado" ? "Ya se ve en la vista previa de tu perfil." : "Quedó como borrador." });
    onClose();
  }

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title={initial.id ? "Editar servicio" : "Nuevo servicio"}
      description="Lo que completes aquí es lo que verán los clientes en tu perfil."
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton onClick={() => save("borrador")}>Guardar borrador</PanelButton>
          <PanelButton variant="primary" onClick={() => save("publicado")}>
            <Check className="h-4 w-4" /> Publicar
          </PanelButton>
        </>
      }
    >
      <form
        className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-4">
          <Field label="Nombre del servicio" htmlFor="sv-name" error={show("name")}>
            <TextInput id="sv-name" value={d.name} onChange={(e) => set("name", e.target.value)} invalid={!!show("name")} placeholder="Show en vivo para bodas" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="sv-cat">
              <Select
                id="sv-cat"
                value={d.category}
                onChange={(e) => {
                  const category = e.target.value as ProviderKind;
                  setD((x) => ({ ...x, category, pricingMode: PRICING_BY_KIND[category].includes(x.pricingMode) ? x.pricingMode : PRICING_BY_KIND[category][0] }));
                }}
              >
                {(Object.keys(KIND_LABEL) as ProviderKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Modalidad de cobro" htmlFor="sv-mode" hint={`Opciones para ${KIND_LABEL[d.category].toLowerCase()}`}>
              <Select id="sv-mode" value={d.pricingMode} onChange={(e) => set("pricingMode", e.target.value as PricingMode)}>
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {PRICING_LABEL[m]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Descripción" htmlFor="sv-desc" error={show("description")} hint={`${d.description.trim().length} caracteres`}>
            <TextArea id="sv-desc" value={d.description} onChange={(e) => set("description", e.target.value)} invalid={!!show("description")} placeholder="Qué ofreces, para qué eventos y qué lo hace especial." />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Precio base" htmlFor="sv-price" error={show("basePrice")} hint={d.pricingMode === "cotizacion" ? "Se cotiza a pedido" : PRICING_LABEL[d.pricingMode]}>
              <MoneyInput id="sv-price" value={d.pricingMode === "cotizacion" ? "" : d.basePrice} onChange={(e) => set("basePrice", e.target.value)} disabled={d.pricingMode === "cotizacion"} invalid={!!show("basePrice")} placeholder={d.pricingMode === "cotizacion" ? "—" : "0"} />
            </Field>
            <Field label="Duración (horas)" htmlFor="sv-dur" error={show("durationHours")}>
              <TextInput id="sv-dur" inputMode="decimal" value={d.durationHours} onChange={(e) => set("durationHours", e.target.value)} invalid={!!show("durationHours")} />
            </Field>
            <Field label="Capacidad" htmlFor="sv-cap" hint="Ej. Hasta 200 invitados">
              <TextInput id="sv-cap" value={d.capacity} onChange={(e) => set("capacity", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Qué incluye">
              <ListEditor label="Qué incluye" items={d.includes} onChange={(v) => set("includes", v)} placeholder="Sonido profesional" />
            </Field>
            <Field label="Qué no incluye">
              <ListEditor label="Qué no incluye" items={d.excludes} onChange={(v) => set("excludes", v)} placeholder="Transporte" />
            </Field>
          </div>
          <Field label="Condiciones especiales" htmlFor="sv-cond">
            <TextArea id="sv-cond" value={d.conditions} onChange={(e) => set("conditions", e.target.value)} placeholder="Requisitos de espacio, horarios de montaje, anticipo…" className="min-h-[72px]" />
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Imagen de portada">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <Thumb src={cover?.url ?? null} alt={cover?.alt ?? ""} className="aspect-[4/3] w-full" />
            </div>
          </Field>
          <div className="flex gap-2">
            <PanelButton size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Subir portada
            </PanelButton>
            <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => {
                uploadCover(e.target.files);
                e.target.value = "";
              }} />
          </div>
          <Field label="Elegir de tu galería" hint="Toca una foto para usarla como portada; mantén las otras como galería adicional.">
            <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto pr-1">
              {ws.galleryOrder.map((id) => {
                const m = ws.media.find((x) => x.id === id);
                if (!m) return null;
                const isCover = d.coverId === id;
                const inGallery = d.galleryIds.includes(id);
                return (
                  <div key={id} className="relative">
                    <button
                      type="button"
                      onClick={() => set("coverId", id)}
                      aria-label={`Usar “${m.title}” como portada`}
                      aria-pressed={isCover}
                      className={cn("block w-full overflow-hidden rounded-lg ring-2 transition focus-visible:outline-none focus-visible:ring-volt", isCover ? "ring-volt" : "ring-transparent hover:ring-white/30")}
                    >
                      <Thumb src={m.url} alt="" className="aspect-square w-full" />
                    </button>
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => set("galleryIds", inGallery ? d.galleryIds.filter((g) => g !== id) : [...d.galleryIds, id])}
                        aria-pressed={inGallery}
                        aria-label={`${inGallery ? "Quitar" : "Agregar"} “${m.title}” ${inGallery ? "de" : "a"} la galería del servicio`}
                        className={cn(
                          "absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
                          inGallery ? "border-volt bg-volt text-ink" : "border-white/40 bg-ink/70 text-white"
                        )}
                      >
                        {inGallery ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      </button>
                    )}
                  </div>
                );
              })}
              {ws.galleryOrder.length === 0 && <p className="col-span-4 text-xs text-ink-mid">Tu galería está vacía. Sube una portada o agrega fotos en Galería.</p>}
            </div>
          </Field>
          <Field label="Estado">
            <div role="radiogroup" aria-label="Estado del servicio" className="grid grid-cols-2 gap-2">
              {(["borrador", "publicado"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  role="radio"
                  aria-checked={d.status === st}
                  onClick={() => set("status", st)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt",
                    d.status === st ? "border-volt bg-volt/10 text-white" : "border-white/10 text-ink-light hover:border-white/25"
                  )}
                >
                  {st}
                </button>
              ))}
            </div>
          </Field>
        </div>
        {/* Lets Enter submit; the visible button lives in the dialog footer. */}
        <button type="submit" hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

export function Services() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [filter, setFilter] = useState<"todos" | Service["status"]>("todos");
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [preview, setPreview] = useState(false);
  const list = useMemo(() => ws.services.filter((s) => filter === "todos" || s.status === filter), [ws.services, filter]);
  const media = (id: string | null) => ws.media.find((m) => m.id === id) ?? null;

  function togglePublish(s: Service) {
    const status = s.status === "publicado" ? "borrador" : "publicado";
    run((w) => ({ ...w, services: w.services.map((x) => (x.id === s.id ? { ...x, status, updatedAt: new Date().toISOString() } : x)) }));
    toast({ tone: "success", title: status === "publicado" ? "Servicio publicado" : "Servicio despublicado", description: s.name });
  }

  function duplicate(s: Service) {
    const copy: Service = { ...s, id: uid("s"), name: `${s.name} (copia)`, status: "borrador", updatedAt: new Date().toISOString() };
    run((w) => ({ ...w, services: [copy, ...w.services] }));
    toast({ tone: "success", title: "Servicio duplicado", description: "La copia quedó como borrador." });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Mis servicios"
        description="Crea y organiza lo que ofreces. Solo los servicios publicados aparecen en tu perfil."
        actions={
          <>
            <PanelButton onClick={() => setPreview(true)}>
              <Eye className="h-4 w-4" /> Vista previa del perfil
            </PanelButton>
            <PanelButton variant="primary" onClick={() => setEditing(emptyDraft(ws.kind))}>
              <Plus className="h-4 w-4" /> Nuevo servicio
            </PanelButton>
          </>
        }
      />

      <div className="flex gap-1" role="tablist" aria-label="Filtrar servicios">
        {(
          [
            ["todos", "Todos"],
            ["publicado", "Publicados"],
            ["borrador", "Borradores"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id)}
            className={cn("relative rounded-full px-3.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt", filter === id ? "text-ink" : "text-ink-light hover:text-white")}
          >
            {filter === id && <motion.span layoutId="svc-filter" className="absolute inset-0 rounded-full bg-volt" />}
            <span className="relative">
              {label} <span className={filter === id ? "text-ink/60" : "text-ink-mid"}>{id === "todos" ? ws.services.length : ws.services.filter((s) => s.status === id).length}</span>
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Store}
          title={ws.services.length ? "No hay servicios en este filtro" : "Crea tu primer servicio"}
          description="Un servicio claro, con foto y precio, es lo que convierte una visita en una solicitud."
          action={
            <PanelButton variant="primary" size="sm" onClick={() => setEditing(emptyDraft(ws.kind))}>
              <Plus className="h-4 w-4" /> Nuevo servicio
            </PanelButton>
          }
        />
      ) : (
        <motion.ul layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence initial={false} mode="popLayout">
            {list.map((s, i) => (
              <motion.li
                key={s.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card className="group h-full overflow-hidden transition-colors hover:border-white/15">
                  <div className="relative">
                    <Thumb src={media(s.coverId)?.url ?? null} alt={media(s.coverId)?.alt ?? ""} className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.03]" />
                    {!s.coverId && (
                      <span className="absolute inset-0 flex items-center justify-center text-ink-mid">
                        <ImagePlus className="h-8 w-8" />
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        s.status === "publicado" ? "bg-emerald-400 text-ink" : "border border-white/20 bg-ink/70 text-ink-light backdrop-blur"
                      )}
                    >
                      {s.status === "publicado" ? "Publicado" : "Borrador"}
                    </span>
                    <div className="absolute right-3 top-3">
                      <ActionMenu
                        label={`Acciones de ${s.name}`}
                        items={[
                          { label: "Editar", icon: Pencil, onSelect: () => setEditing(toDraft(s)) },
                          { label: "Duplicar", icon: Copy, onSelect: () => duplicate(s) },
                          { label: s.status === "publicado" ? "Despublicar" : "Publicar", icon: s.status === "publicado" ? EyeOff : Eye, onSelect: () => togglePublish(s) },
                          "separator",
                          { label: "Eliminar", icon: Trash2, danger: true, onSelect: () => setDeleting(s) },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-ink-mid">{KIND_LABEL[s.category]}</p>
                    <h3 className="mt-1 font-general text-base font-semibold text-white">{s.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-mid">{s.description}</p>
                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3">
                      <span className="font-general text-lg font-semibold text-white">{priceLabel(s.basePrice, s.pricingMode)}</span>
                      <span className="flex flex-col items-end gap-0.5 text-xs text-ink-mid">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {s.durationHours} h
                        </span>
                        {s.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {s.capacity}
                          </span>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(toDraft(s))}
                      className="mt-3 w-full rounded-xl border border-white/10 py-2 text-sm text-ink-light transition-colors hover:border-volt/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                    >
                      Editar servicio
                    </button>
                  </div>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {editing && <ServiceForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar este servicio?"
        description={deleting ? `“${deleting.name}” dejará de verse en tu perfil. Las solicitudes que ya recibiste se conservan.` : undefined}
        onConfirm={() => {
          if (!deleting) return;
          run((w) => ({
            ...w,
            services: w.services.filter((s) => s.id !== deleting.id),
            promotions: w.promotions.map((p) => ({ ...p, serviceIds: p.serviceIds.filter((id) => id !== deleting.id) })),
            profile: { ...w.profile, featuredServiceIds: w.profile.featuredServiceIds.filter((id) => id !== deleting.id) },
          }));
          toast({ tone: "success", title: "Servicio eliminado", description: deleting.name });
        }}
      />
      <Modal open={preview} onOpenChange={setPreview} size="xl" title="Vista previa del perfil público" description="Así verán los clientes tus servicios publicados.">
        <PublicPreview ws={ws} />
      </Modal>
    </div>
  );
}
