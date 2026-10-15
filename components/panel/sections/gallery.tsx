"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Eye, ImageIcon, ImagePlus, Pencil, Star, Trash2, UploadCloud, X } from "lucide-react";
import type { MediaItem } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { ActionMenu, Card, DemoNote, EmptyState, SectionHeader, Thumb } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { Field, TextArea, TextInput } from "@/components/panel/ui/fields";
import { ACCEPT_ATTR, formatSize, intakeFiles } from "@/lib/panel/media";
import { revokeLocalUrl } from "@/lib/panel/object-urls";
import { formatBs, KIND_LABEL } from "@/lib/panel/format";
import { cn } from "@/lib/utils";

interface Intake {
  name: string;
  size: number;
  ok: boolean;
  message?: string;
}

function Dropzone({ onFiles }: { onFiles: (files: FileList | File[]) => void }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200",
        over ? "border-volt bg-volt/[0.07]" : "border-white/10 bg-white/[0.02]"
      )}
    >
      <motion.span animate={over ? { y: -6, scale: 1.08 } : { y: 0, scale: 1 }} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-volt/10 text-volt">
        <UploadCloud className="h-7 w-7" />
      </motion.span>
      <p className="font-general text-base font-semibold text-white">{over ? "Suelta las fotos aquí" : "Arrastra tus fotos aquí"}</p>
      <p className="text-sm text-ink-mid">JPG, PNG o WebP · hasta 5 MB por imagen · puedes elegir varias</p>
      <PanelButton variant="primary" size="sm" onClick={() => input.current?.click()}>
        <ImagePlus className="h-4 w-4" /> Elegir desde mi dispositivo
      </PanelButton>
      <input
        ref={input}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function EditDialog({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  const { run } = usePanel();
  const toast = useToast();
  const [title, setTitle] = useState(item.title);
  const [alt, setAlt] = useState(item.alt);
  const [submitted, setSubmitted] = useState(false);
  const altError = alt.trim().length < 5 ? "Describe la foto en al menos 5 caracteres; lo leen los lectores de pantalla." : null;
  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      title="Editar foto"
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton
            variant="primary"
            onClick={() => {
              setSubmitted(true);
              if (altError) return;
              run((w) => ({ ...w, media: w.media.map((m) => (m.id === item.id ? { ...m, title: title.trim() || m.title, alt: alt.trim() } : m)) }));
              toast({ tone: "success", title: "Foto actualizada" });
              onClose();
            }}
          >
            Guardar
          </PanelButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Thumb src={item.url} alt={item.alt} className="aspect-video w-full rounded-2xl" />
        <Field label="Título o descripción" htmlFor="ph-title">
          <TextInput id="ph-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Texto alternativo" htmlFor="ph-alt" error={submitted ? altError : null} hint="Qué se ve en la foto, para personas que no pueden verla.">
          <TextArea id="ph-alt" value={alt} onChange={(e) => setAlt(e.target.value)} invalid={submitted && !!altError} className="min-h-[72px]" />
        </Field>
      </div>
    </Modal>
  );
}

export function Gallery() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [intake, setIntake] = useState<Intake[]>([]);
  const [fresh, setFresh] = useState<string[]>([]);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<MediaItem | null>(null);
  const [preview, setPreview] = useState(false);
  const [coverPicker, setCoverPicker] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const items = ws.galleryOrder.map((id) => ws.media.find((m) => m.id === id)).filter(Boolean) as MediaItem[];
  const cover = ws.media.find((m) => m.id === ws.coverMediaId) ?? null;

  function addFiles(files: FileList | File[]) {
    const { accepted, errors } = intakeFiles(files);
    const list = Array.from(files);
    setIntake(list.map((f) => ({ name: f.name, size: f.size, ok: !errors.some((e) => e.startsWith(`${f.name}:`)), message: errors.find((e) => e.startsWith(`${f.name}:`))?.split(": ").slice(1).join(": ") })));
    if (accepted.length) {
      run((w) => ({ ...w, media: [...w.media, ...accepted], galleryOrder: [...w.galleryOrder, ...accepted.map((a) => a.id)], coverMediaId: w.coverMediaId ?? accepted[0].id }));
      setFresh(accepted.map((a) => a.id));
      toast({ tone: "success", title: accepted.length === 1 ? "Foto agregada" : `${accepted.length} fotos agregadas`, description: "Vista previa local: se guardará de forma permanente cuando conectemos el servidor." });
    }
    if (errors.length) toast({ tone: "error", title: errors.length === 1 ? "Una foto no se pudo agregar" : `${errors.length} fotos no se pudieron agregar`, description: errors[0] });
  }

  function move(id: string, to: number) {
    run((w) => {
      const order = w.galleryOrder.filter((x) => x !== id);
      order.splice(Math.max(0, Math.min(order.length, to)), 0, id);
      return { ...w, galleryOrder: order };
    });
  }

  function remove(item: MediaItem) {
    run((w) => ({
      ...w,
      media: w.media.filter((m) => m.id !== item.id),
      galleryOrder: w.galleryOrder.filter((id) => id !== item.id),
      coverMediaId: w.coverMediaId === item.id ? w.galleryOrder.find((id) => id !== item.id) ?? null : w.coverMediaId,
      services: w.services.map((s) => ({ ...s, coverId: s.coverId === item.id ? null : s.coverId, galleryIds: s.galleryIds.filter((id) => id !== item.id) })),
    }));
    // The preview's memory is released only once nothing points at it any more.
    revokeLocalUrl(item.url);
    toast({ tone: "success", title: "Foto eliminada" });
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Galería multimedia"
        description="Tus mejores fotos venden por ti. La primera es la foto principal de tu perfil."
        actions={
          <PanelButton onClick={() => setPreview(true)} disabled={!items.length}>
            <Eye className="h-4 w-4" /> Ver galería pública
          </PanelButton>
        }
      />
      <DemoNote>
        Las fotos que subas se muestran como vista previa solo en este navegador; no se envían a ningún servidor. El almacenamiento permanente se implementará al integrar el backend.
      </DemoNote>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-3">
          <Dropzone onFiles={addFiles} />
          <AnimatePresence>
            {intake.length > 0 && (
              <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-1.5 rounded-2xl border border-white/[0.08] p-3" aria-label="Archivos seleccionados">
                <li className="flex items-center justify-between pb-1 text-xs text-ink-mid">
                  Archivos seleccionados
                  <button type="button" onClick={() => setIntake([])} aria-label="Ocultar lista" className="rounded-full p-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
                {intake.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center gap-2.5 text-sm">
                    {f.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-volt" /> : <AlertCircle className="h-4 w-4 shrink-0 text-red-300" />}
                    <span className="min-w-0 flex-1 truncate text-white">{f.name}</span>
                    <span className={cn("shrink-0 text-xs", f.ok ? "text-ink-mid" : "text-red-300")}>{f.ok ? formatSize(f.size) : f.message}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-general text-base font-semibold text-white">Portada en VIBRA</h2>
              <p className="mt-0.5 text-xs text-ink-mid">La imagen de tu tarjeta en el directorio y en la portada del sitio.</p>
            </div>
            <PanelButton size="sm" onClick={() => setCoverPicker(true)} disabled={!items.length}>
              Cambiar
            </PanelButton>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="relative">
              <Thumb src={cover?.url ?? null} alt={cover?.alt ?? ""} className="aspect-[16/10] w-full" />
              {!cover && (
                <span className="absolute inset-0 flex items-center justify-center text-ink-mid">
                  <ImageIcon className="h-8 w-8" />
                </span>
              )}
              <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] text-ink-light backdrop-blur">{KIND_LABEL[ws.profile.categories[0] ?? ws.kind]}</span>
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="font-medium text-white">{ws.profile.businessName}</span>
              <span className="text-sm text-ink-mid">Desde {formatBs(ws.pricing.basePrice)}</span>
            </div>
          </div>
        </Card>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Tu galería está vacía" description="Sube al menos 6 fotos de eventos reales: montaje, ambiente, detalles y tu equipo en acción." />
      ) : (
        <div>
          <p className="mb-3 text-xs text-ink-mid">
            {items.length} fotos · arrastra para reordenar o usa las flechas · la primera es la principal
          </p>
          <motion.ul layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence initial={false}>
              {items.map((m, i) => (
                <motion.li
                  key={m.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: dragId === m.id ? 0.4 : 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  draggable
                  onDragStartCapture={(e: React.DragEvent) => {
                    setDragId(m.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOverCapture={(e: React.DragEvent) => {
                    if (!dragId || dragId === m.id) return;
                    e.preventDefault();
                  }}
                  onDropCapture={(e: React.DragEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragId && dragId !== m.id) move(dragId, i);
                    setDragId(null);
                  }}
                  onDragEndCapture={() => setDragId(null)}
                  className={cn("group relative overflow-hidden rounded-2xl border bg-white/[0.02]", fresh.includes(m.id) ? "border-volt/60" : "border-white/[0.08]")}
                >
                  <div className="relative cursor-grab active:cursor-grabbing">
                    <Thumb src={m.url} alt={m.alt} className="aspect-square w-full transition-transform duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute left-2 top-2 flex flex-wrap gap-1">
                      {i === 0 && (
                        <span className="flex items-center gap-1 rounded-full bg-volt px-2 py-0.5 text-[10px] font-bold text-ink">
                          <Star className="h-3 w-3" /> Principal
                        </span>
                      )}
                      {ws.coverMediaId === m.id && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink">Portada</span>}
                      {m.source === "local" && <span className="rounded-full bg-ink/75 px-2 py-0.5 text-[10px] text-ink-light backdrop-blur">Vista previa local</span>}
                    </div>
                    <div className="absolute right-2 top-2">
                      <ActionMenu
                        label={`Acciones de la foto ${m.title}`}
                        items={[
                          { label: "Editar título y texto alternativo", icon: Pencil, onSelect: () => setEditing(m) },
                          ...(i > 0 ? [
                                {
                                  label: "Hacer foto principal",
                                  icon: Star,
                                  onSelect: () => {
                                    move(m.id, 0);
                                    toast({ tone: "success", title: "Nueva foto principal" });
                                  },
                                },
                              ] : []),
                          ...(ws.coverMediaId !== m.id
                            ? [
                                {
                                  label: "Usar como portada",
                                  icon: ImageIcon,
                                  onSelect: () => {
                                    run((w) => ({ ...w, coverMediaId: m.id }));
                                    toast({ tone: "success", title: "Portada actualizada" });
                                  },
                                },
                              ]
                            : []),
                          "separator",
                          { label: "Eliminar", icon: Trash2, danger: true, onSelect: () => setDeleting(m) },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-2">
                    <p className="min-w-0 flex-1 truncate px-1 text-xs text-ink-light" title={m.title}>
                      {m.title}
                      {m.size ? <span className="text-ink-mid"> · {formatSize(m.size)}</span> : null}
                    </p>
                    <button
                      type="button"
                      onClick={() => move(m.id, i - 1)}
                      disabled={i === 0}
                      aria-label={`Mover ${m.title} antes`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-white disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(m.id, i + 1)}
                      disabled={i === items.length - 1}
                      aria-label={`Mover ${m.title} después`}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-white disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      )}

      {editing && <EditDialog item={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar esta foto?"
        description="Se quitará de tu galería y de los servicios que la usen."
        onConfirm={() => deleting && remove(deleting)}
      >
        {deleting && <Thumb src={deleting.url} alt={deleting.alt} className="aspect-video w-full rounded-2xl" />}
      </ConfirmDialog>

      <Modal open={coverPicker} onOpenChange={setCoverPicker} size="lg" title="Elige la portada" description="Se verá en tu tarjeta del directorio de VIBRA.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={ws.coverMediaId === m.id}
              onClick={() => {
                run((w) => ({ ...w, coverMediaId: m.id }));
                toast({ tone: "success", title: "Portada actualizada" });
                setCoverPicker(false);
              }}
              className={cn("overflow-hidden rounded-2xl ring-2 transition focus-visible:outline-none focus-visible:ring-volt", ws.coverMediaId === m.id ? "ring-volt" : "ring-transparent hover:ring-white/30")}
            >
              <Thumb src={m.url} alt={m.alt} className="aspect-[16/10] w-full" />
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={preview} onOpenChange={setPreview} size="xl" title="Así se verá tu galería" description="Vista pública, en el orden que definiste.">
        <div className="columns-2 gap-3 sm:columns-3">
          {items.map((m, i) => (
            <motion.figure key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="mb-3 break-inside-avoid overflow-hidden rounded-2xl">
              <Thumb src={m.url} alt={m.alt} className={cn("w-full", i % 3 === 0 ? "aspect-[3/4]" : "aspect-square")} />
              <figcaption className="px-1 pt-1.5 text-xs text-ink-mid">{m.title}</figcaption>
            </motion.figure>
          ))}
        </div>
      </Modal>
    </div>
  );
}
