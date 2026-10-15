"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, ImageIcon, Monitor, PencilLine, Plus, Smartphone, Trash2, Upload, X } from "lucide-react";
import type { Faq, ProviderKind, PublicProfile } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { Card, SectionHeader, Thumb } from "@/components/panel/ui/misc";
import { Modal, PanelButton } from "@/components/panel/ui/modal";
import { ChipGroup, Field, Switch, TextArea, TextInput } from "@/components/panel/ui/fields";
import { PublicPreview } from "@/components/panel/public-preview";
import { KIND_LABEL, uid } from "@/lib/panel/format";
import { ACCEPT_ATTR, intakeFiles } from "@/lib/panel/media";
import { revokeLocalUrl } from "@/lib/panel/object-urls";
import { cn } from "@/lib/utils";

function validate(p: PublicProfile) {
  const digits = p.phone.replace(/\D/g, "");
  return {
    businessName: p.businessName.trim().length < 3 ? "Escribe tu nombre comercial" : null,
    description: p.description.trim().length > 0 && p.description.trim().length < 60 ? `Cuéntales un poco más (${p.description.trim().length}/60 caracteres mínimos)` : null,
    phone: p.phone.trim() && (!/^[+\d\s()-]+$/.test(p.phone) || digits.length < 7 || digits.length > 15) ? "Usa solo números, espacios y +, entre 7 y 15 dígitos" : null,
    yearsExperience: !Number.isInteger(p.yearsExperience) || p.yearsExperience < 0 || p.yearsExperience > 80 ? "Entre 0 y 80 años" : null,
    categories: p.categories.length === 0 ? "Elige al menos una categoría" : null,
  };
}

function ImagePicker({ label, url, onPick, onClear, shape }: { label: string; url: string | null; onPick: (files: FileList) => void; onClear: () => void; shape: "logo" | "cover" }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <Field label={label}>
      <div className="flex items-center gap-4">
        <div className={cn("relative shrink-0 overflow-hidden border border-white/10 bg-white/[0.03]", shape === "logo" ? "h-20 w-20 rounded-2xl" : "h-20 w-36 rounded-2xl")}>
          {url ? <Thumb src={url} alt="" className={cn("h-full w-full", shape === "logo" && "object-contain p-1.5")} /> : <ImageIcon className="absolute inset-0 m-auto h-6 w-6 text-ink-mid" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <PanelButton size="sm" onClick={() => input.current?.click()}>
            <Upload className="h-4 w-4" /> {url ? "Cambiar" : "Subir"}
          </PanelButton>
          {url && (
            <PanelButton size="sm" variant="ghost" onClick={onClear}>
              <X className="h-4 w-4" /> Quitar
            </PanelButton>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            if (e.target.files?.length) onPick(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </Field>
  );
}

export function ProfileEditor() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [draft, setDraft] = useState<PublicProfile>(ws.profile);
  const [view, setView] = useState<"editor" | "preview">("editor");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [submitted, setSubmitted] = useState(false);
  const [coverPicker, setCoverPicker] = useState(false);
  // Previews created while editing; released if the edit is discarded.
  const draftUrls = useRef<string[]>([]);

  const errors = validate(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(ws.profile);
  const set = <K extends keyof PublicProfile>(k: K, v: PublicProfile[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const published = ws.services.filter((s) => s.status === "publicado");

  function pickImage(files: FileList, key: "logoUrl" | "coverUrl") {
    const { accepted, errors: fileErrors } = intakeFiles([files[0]]);
    fileErrors.forEach((e) => toast({ tone: "error", title: "Imagen no válida", description: e }));
    if (!accepted[0]) return;
    const previous = draft[key];
    if (previous && draftUrls.current.includes(previous)) revokeLocalUrl(previous);
    draftUrls.current.push(accepted[0].url);
    set(key, accepted[0].url);
  }

  function save() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return toast({ tone: "error", title: "Revisa los datos del perfil", description: "Hay campos con errores." });
    if (draft.published && (!draft.description.trim() || published.length === 0)) {
      return toast({ tone: "error", title: "Aún no se puede publicar", description: "Necesitas una descripción y al menos un servicio publicado." });
    }
    const old = ws.profile;
    run((w) => ({ ...w, profile: { ...draft, businessName: draft.businessName.trim(), description: draft.description.trim() } }));
    // Replaced images that were local previews can be released now.
    if (old.logoUrl !== draft.logoUrl) revokeLocalUrl(old.logoUrl);
    if (old.coverUrl !== draft.coverUrl && !ws.media.some((m) => m.url === old.coverUrl)) revokeLocalUrl(old.coverUrl);
    draftUrls.current = [];
    setSubmitted(false);
    toast({ tone: "success", title: "Perfil actualizado", description: "Los cambios ya se ven en la vista previa. En la demo no se guardan al recargar." });
  }

  function discard() {
    draftUrls.current.forEach((u) => u !== ws.profile.logoUrl && u !== ws.profile.coverUrl && revokeLocalUrl(u));
    draftUrls.current = [];
    setDraft(ws.profile);
    setSubmitted(false);
  }

  const previewWs = { ...ws, profile: draft };
  const err = (k: keyof typeof errors) => (submitted ? errors[k] : null);

  const editor = (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-general text-base font-semibold text-white">Identidad</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre comercial" htmlFor="pf-name" error={err("businessName")}>
            <TextInput id="pf-name" value={draft.businessName} onChange={(e) => set("businessName", e.target.value)} invalid={!!err("businessName")} />
          </Field>
          <Field label="Frase principal" htmlFor="pf-tag" hint="Una línea que resuma lo que haces">
            <TextInput id="pf-tag" value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ImagePicker label="Logotipo" shape="logo" url={draft.logoUrl} onPick={(f) => pickImage(f, "logoUrl")} onClear={() => set("logoUrl", null)} />
          <div className="flex flex-col gap-2">
            <ImagePicker label="Imagen de portada" shape="cover" url={draft.coverUrl} onPick={(f) => pickImage(f, "coverUrl")} onClear={() => set("coverUrl", null)} />
            {ws.galleryOrder.length > 0 && (
              <button type="button" onClick={() => setCoverPicker(true)} className="self-start text-xs text-volt hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                o elegir una de tu galería
              </button>
            )}
          </div>
        </div>
        <Field label="Descripción" htmlFor="pf-desc" error={err("description")} hint={`${draft.description.trim().length} caracteres · se recomienda más de 60`}>
          <TextArea id="pf-desc" value={draft.description} onChange={(e) => set("description", e.target.value)} invalid={!!err("description")} className="min-h-[120px]" />
        </Field>
        <Field label="Categorías" error={err("categories")}>
          <ChipGroup label="Categorías" value={draft.categories} onChange={(v) => set("categories", v as ProviderKind[])} options={(Object.keys(KIND_LABEL) as ProviderKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))} />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-general text-base font-semibold text-white">Contacto y trayectoria</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Ciudad" htmlFor="pf-city">
            <TextInput id="pf-city" value={draft.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="Zona" htmlFor="pf-zone">
            <TextInput id="pf-zone" value={draft.zone} onChange={(e) => set("zone", e.target.value)} placeholder="Zona Norte" />
          </Field>
          <Field label="Años de experiencia" htmlFor="pf-years" error={err("yearsExperience")}>
            <TextInput id="pf-years" inputMode="numeric" value={String(draft.yearsExperience)} onChange={(e) => set("yearsExperience", Number(e.target.value.replace(/\D/g, "") || 0))} invalid={!!err("yearsExperience")} />
          </Field>
        </div>
        <Field label="Teléfono comercial" htmlFor="pf-phone" error={err("phone")} hint="Lo usan los clientes para escribirte por WhatsApp">
          <TextInput id="pf-phone" type="tel" value={draft.phone} onChange={(e) => set("phone", e.target.value)} invalid={!!err("phone")} placeholder="+591 7xx xxxxx" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["instagram", "facebook", "tiktok", "youtube"] as const).map((net) => (
            <Field key={net} label={net[0].toUpperCase() + net.slice(1)} htmlFor={`pf-${net}`}>
              <TextInput id={`pf-${net}`} value={draft.socials[net]} onChange={(e) => set("socials", { ...draft.socials, [net]: e.target.value.trim() })} placeholder="usuario" />
            </Field>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5 sm:p-6">
        <h2 className="font-general text-base font-semibold text-white">Lo que se destaca</h2>
        <Field label="Servicios destacados" hint={published.length ? "Aparecen primero en tu perfil (máximo 4)" : "Publica un servicio para poder destacarlo"}>
          <ChipGroup
            label="Servicios destacados"
            value={draft.featuredServiceIds.filter((id) => published.some((s) => s.id === id))}
            onChange={(v) => (v.length <= 4 ? set("featuredServiceIds", v) : toast({ tone: "info", title: "Máximo 4 servicios destacados" }))}
            options={published.map((s) => ({ value: s.id, label: s.name }))}
          />
        </Field>
        <p className="text-xs text-ink-mid">
          La galería y los paquetes se administran en sus secciones y aparecen aquí automáticamente: {ws.galleryOrder.length} fotos, {ws.packages.length} paquetes.
        </p>
        <div>
          <p className="text-[13px] font-medium text-ink-light">Preguntas frecuentes</p>
          <ul className="mt-2 flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {draft.faqs.map((f, i) => (
                <motion.li key={f.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-2xl border border-white/[0.08] p-3">
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col gap-2">
                      <TextInput aria-label={`Pregunta ${i + 1}`} value={f.question} onChange={(e) => set("faqs", draft.faqs.map((x) => (x.id === f.id ? { ...x, question: e.target.value } : x)))} placeholder="Pregunta" />
                      <TextArea aria-label={`Respuesta ${i + 1}`} value={f.answer} onChange={(e) => set("faqs", draft.faqs.map((x) => (x.id === f.id ? { ...x, answer: e.target.value } : x)))} placeholder="Respuesta" className="min-h-[64px]" />
                    </div>
                    <button
                      type="button"
                      aria-label={`Eliminar pregunta ${i + 1}`}
                      onClick={() => set("faqs", draft.faqs.filter((x) => x.id !== f.id))}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <PanelButton size="sm" className="mt-3" onClick={() => set("faqs", [...draft.faqs, { id: uid("f"), question: "", answer: "" } as Faq])}>
            <Plus className="h-4 w-4" /> Agregar pregunta
          </PanelButton>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <Switch checked={draft.published} onChange={(v) => set("published", v)} label="Perfil publicado" description="Si lo despublicas, desaparece del directorio y de las búsquedas de VIBRA." />
      </Card>
    </div>
  );

  const preview = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-mid">Vista previa pública</p>
        <div className="flex gap-1 rounded-full border border-white/10 p-1" role="group" aria-label="Tamaño de la vista previa">
          {(
            [
              ["desktop", Monitor, "Escritorio"],
              ["mobile", Smartphone, "Móvil"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              aria-label={label}
              onClick={() => setDevice(id)}
              className={cn("flex h-8 w-8 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt", device === id ? "bg-volt text-ink" : "text-ink-mid hover:text-white")}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <motion.div layout className={cn("mx-auto w-full", device === "mobile" && "max-w-[390px]")}>
        <PublicPreview ws={previewWs} narrow={device === "mobile"} />
      </motion.div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Perfil público"
        description="Así te presentas ante los clientes. La vista previa se actualiza mientras escribes."
        actions={
          <div className="flex gap-1 rounded-full border border-white/10 p-1 xl:hidden" role="tablist" aria-label="Vista">
            {(
              [
                ["editor", PencilLine, "Editor"],
                ["preview", Eye, "Vista previa"],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn("relative flex items-center gap-2 rounded-full px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt", view === id ? "text-ink" : "text-ink-light")}
              >
                {view === id && <motion.span layoutId="pf-view" className="absolute inset-0 rounded-full bg-volt" />}
                <Icon className="relative h-4 w-4" />
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr] xl:items-start">
        <div className={cn(view === "preview" && "hidden xl:block")}>{editor}</div>
        <div className={cn("xl:sticky xl:top-24", view === "editor" && "hidden xl:block")}>{preview}</div>
      </div>

      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl items-center justify-between gap-3 rounded-2xl border border-volt/40 bg-[#1c1c1c]/95 px-4 py-3 shadow-2xl backdrop-blur-xl lg:left-[272px]"
            role="region"
            aria-label="Cambios sin guardar"
          >
            <span className="text-sm text-white">Tienes cambios sin guardar</span>
            <span className="flex gap-2">
              <PanelButton size="sm" variant="ghost" onClick={discard}>
                Descartar
              </PanelButton>
              <PanelButton size="sm" variant="primary" onClick={save}>
                Guardar cambios
              </PanelButton>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={coverPicker} onOpenChange={setCoverPicker} size="lg" title="Portada desde tu galería">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ws.galleryOrder.map((id) => {
            const m = ws.media.find((x) => x.id === id);
            if (!m) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  set("coverUrl", m.url);
                  setCoverPicker(false);
                }}
                aria-pressed={draft.coverUrl === m.url}
                className={cn("overflow-hidden rounded-2xl ring-2 focus-visible:outline-none focus-visible:ring-volt", draft.coverUrl === m.url ? "ring-volt" : "ring-transparent hover:ring-white/30")}
              >
                <Thumb src={m.url} alt={m.alt} className="aspect-[16/10] w-full" />
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
