"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, ExternalLink, Music, Pencil, Play, Plus, Trash2 } from "lucide-react";
import type { MusicTrack } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { Card, DemoNote, EmptyState, SectionHeader, Thumb } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { Field, TextInput } from "@/components/panel/ui/fields";
import { KIND_LABEL, uid } from "@/lib/panel/format";
import { parseYouTube, youtubeThumb, youtubeUrl } from "@/lib/panel/youtube";
import { cn } from "@/lib/utils";

export const MUSIC_KINDS = ["musica", "dj"] as const;
const MAX_TRACKS = 10;

function AddForm() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const parsed = parseYouTube(link);
  const duplicate = parsed.id && ws.music.some((t) => t.youtubeId === parsed.id);
  const error = parsed.error ?? (duplicate ? "Esa canción ya está en tu lista" : ws.music.length >= MAX_TRACKS ? `Puedes tener hasta ${MAX_TRACKS} canciones` : null);

  function add() {
    setSubmitted(true);
    if (error || !parsed.id) return;
    const track: MusicTrack = { id: uid("t"), youtubeId: parsed.id, title: title.trim() || `Canción ${ws.music.length + 1}` };
    run((w) => ({ ...w, music: [...w.music, track] }));
    toast({ tone: "success", title: "Canción agregada", description: track.title });
    setLink("");
    setTitle("");
    setSubmitted(false);
  }

  return (
    <Card className="p-5 sm:p-6">
      <h2 className="font-general text-base font-semibold text-white">Agregar desde YouTube</h2>
      <p className="mt-1 text-sm text-ink-mid">Copia el enlace del video en YouTube (botón Compartir) y pégalo aquí.</p>
      <form
        className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr_auto] lg:items-start"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Field label="Enlace de YouTube" htmlFor="mu-link" error={submitted ? error : null} hint={parsed.id && !error ? "Video encontrado" : "Ej. https://youtu.be/AA2HFtHbe_A"}>
          <TextInput id="mu-link" value={link} onChange={(e) => setLink(e.target.value)} invalid={submitted && !!error} placeholder="https://www.youtube.com/watch?v=…" inputMode="url" />
        </Field>
        <Field label="Nombre de la canción" htmlFor="mu-title" hint="Opcional; así se verá en el reproductor">
          <TextInput id="mu-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="La Foto" />
        </Field>
        <PanelButton type="submit" variant="primary" className="lg:mt-[26px]">
          <Plus className="h-4 w-4" /> Agregar
        </PanelButton>
      </form>
      <AnimatePresence>
        {parsed.id && !error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-volt/30 bg-volt/[0.05] p-3">
              <Thumb src={youtubeThumb(parsed.id)} alt="" className="h-12 w-20 shrink-0 rounded-lg" />
              <p className="text-sm text-ink-light">Vista previa del video que vas a agregar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function MusicSection() {
  const { ws, run } = usePanel();
  const toast = useToast();
  const [playing, setPlaying] = useState<MusicTrack | null>(null);
  const [renaming, setRenaming] = useState<{ track: MusicTrack; title: string } | null>(null);
  const [deleting, setDeleting] = useState<MusicTrack | null>(null);
  const allowed = (MUSIC_KINDS as readonly string[]).includes(ws.kind);

  function move(id: string, delta: number) {
    run((w) => {
      const list = [...w.music];
      const i = list.findIndex((t) => t.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= list.length) return w;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...w, music: list };
    });
  }

  if (!allowed) {
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title="Música" />
        <EmptyState icon={Music} title="Disponible para grupos musicales y DJs" description={`Tu perfil es de ${KIND_LABEL[ws.kind].toLowerCase()}; esta sección no aplica.`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="Música" description="Las canciones que suenan cuando un cliente visita tu perfil. La primera es la que suena primero." />
      <DemoNote>
        Usa videos de tu canal oficial o con permiso del autor, y que se puedan insertar en otros sitios (en YouTube: Compartir → Insertar). En esta demo la lista se ve en la vista
        previa de tu perfil; publicarla en tu página pública requiere el backend.
      </DemoNote>

      <AddForm />

      {ws.music.length === 0 ? (
        <EmptyState icon={Music} title="Todavía no agregaste canciones" description="Con dos o tres temas que muestren tu estilo, los clientes te escuchan antes de escribirte." />
      ) : (
        <Card className="p-3 sm:p-4">
          <p className="px-2 pb-2 text-xs text-ink-mid">
            {ws.music.length} de {MAX_TRACKS} canciones
          </p>
          <ol className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {ws.music.map((t, i) => (
                <motion.li
                  key={t.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  className={cn("flex items-center gap-3 rounded-2xl border p-2.5 sm:gap-4", i === 0 ? "border-volt/40 bg-volt/[0.05]" : "border-white/[0.08]")}
                >
                  <span className="w-5 shrink-0 text-center font-general text-sm text-ink-mid">{i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setPlaying(t)}
                    aria-label={`Escuchar ${t.title}`}
                    className="group relative h-14 w-24 shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
                  >
                    <Thumb src={youtubeThumb(t.youtubeId)} alt="" className="h-full w-full" />
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-80 transition-opacity group-hover:opacity-100">
                      <Play className="h-5 w-5 fill-white text-white" />
                    </span>
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{t.title}</p>
                    <p className="text-xs text-ink-mid">{i === 0 ? "Suena primero" : `youtu.be/${t.youtubeId}`}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => move(t.id, -1)} disabled={i === 0} aria-label={`Subir ${t.title}`} className="hidden h-9 w-9 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-white disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt sm:flex">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => move(t.id, 1)} disabled={i === ws.music.length - 1} aria-label={`Bajar ${t.title}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-white disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setRenaming({ track: t, title: t.title })} aria-label={`Renombrar ${t.title}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => setDeleting(t)} aria-label={`Eliminar ${t.title}`} className="flex h-9 w-9 items-center justify-center rounded-full text-ink-mid hover:bg-white/5 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        </Card>
      )}

      <Modal open={!!playing} onOpenChange={(o) => !o && setPlaying(null)} size="lg" title={playing?.title ?? ""} description="Si el video no se reproduce aquí, su autor no permite insertarlo en otros sitios: elige otro.">
        {playing && (
          <div className="flex flex-col gap-3">
            <div className="aspect-video overflow-hidden rounded-2xl bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${playing.youtubeId}?autoplay=1&rel=0`}
                title={playing.title}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
            <a href={youtubeUrl(playing.youtubeId)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 self-start text-xs text-ink-mid hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt">
              Abrir en YouTube <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </Modal>

      <Modal
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        size="sm"
        title="Nombre de la canción"
        footer={
          <>
            <PanelButton variant="ghost" onClick={() => setRenaming(null)}>
              Cancelar
            </PanelButton>
            <PanelButton
              variant="primary"
              disabled={!renaming?.title.trim()}
              onClick={() => {
                if (!renaming) return;
                run((w) => ({ ...w, music: w.music.map((t) => (t.id === renaming.track.id ? { ...t, title: renaming.title.trim() } : t)) }));
                toast({ tone: "success", title: "Nombre actualizado" });
                setRenaming(null);
              }}
            >
              Guardar
            </PanelButton>
          </>
        }
      >
        {renaming && (
          <Field label="Nombre" htmlFor="mu-rename" error={renaming.title.trim() ? null : "Escribe un nombre"}>
            <TextInput id="mu-rename" value={renaming.title} onChange={(e) => setRenaming({ ...renaming, title: e.target.value })} autoFocus />
          </Field>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Quitar esta canción?"
        description={deleting?.title}
        confirmLabel="Quitar"
        onConfirm={() => {
          if (!deleting) return;
          run((w) => ({ ...w, music: w.music.filter((t) => t.id !== deleting.id) }));
          toast({ tone: "success", title: "Canción quitada" });
        }}
      />
    </div>
  );
}
