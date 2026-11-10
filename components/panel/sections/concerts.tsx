"use client";

import { useRef, useState } from "react";
import { CalendarClock, Copy, ExternalLink, Heart, ImagePlus, Mic2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { PanelConcert, ProviderWorkspace } from "@/lib/panel/types";
import { usePanel } from "@/components/panel/store";
import { useToast } from "@/components/panel/ui/toaster";
import { ActionMenu, Card, DemoNote, EmptyState, KpiCard, SectionHeader } from "@/components/panel/ui/misc";
import { ConfirmDialog, Modal, PanelButton } from "@/components/panel/ui/modal";
import { Field, MoneyInput, Select, Switch, TextArea, TextInput } from "@/components/panel/ui/fields";
import { ConcertPoster, type PosterArtist } from "@/components/concerts/concert-poster";
import { concertDate, concertSlug, isUpcoming, priceText } from "@/lib/concerts";
import { dateKey, KIND_LABEL, uid } from "@/lib/panel/format";
import { parseAmount } from "@/lib/panel/logic";
import { ACCEPT_ATTR, validateImage } from "@/lib/panel/media";
import { createLocalUrl, revokeLocalUrl } from "@/lib/panel/object-urls";
import { getProvider } from "@/lib/providers";
import { cn } from "@/lib/utils";

type PriceMode = "confirmar" | "libre" | "pago";
type Draft = Omit<PanelConcert, "price"> & { priceMode: PriceMode; price: string };

const TIME = /^\d{2}:\d{2}$/;

/** What the poster shows of the artist: their cut-out photo from the site when there is one. */
function artistFor(ws: ProviderWorkspace): PosterArtist {
  const site = getProvider(ws.publicSlug);
  return {
    name: ws.profile.businessName,
    photo: site?.subject.src || ws.profile.logoUrl,
    cover: ws.profile.coverUrl ?? site?.heroImage ?? null,
    tags: site?.tags ?? ws.profile.categories.map((k) => KIND_LABEL[k]),
  };
}

function toDraft(c: PanelConcert): Draft {
  return { ...c, priceMode: c.price === null ? "confirmar" : c.price === 0 ? "libre" : "pago", price: c.price ? String(c.price) : "" };
}

function blank(ws: ProviderWorkspace): Draft {
  return {
    id: "",
    slug: "",
    title: `${ws.profile.businessName} en vivo`,
    description: "",
    date: "",
    start: "21:00",
    end: "23:00",
    venue: "",
    city: ws.profile.city || "Cochabamba",
    address: "",
    posterUrl: null,
    ticketUrl: null,
    priceMode: "confirmar",
    price: "",
    published: true,
    interested: 0,
  };
}

function ConcertForm({ initial, onClose }: { initial: Draft; onClose: () => void }) {
  const { ws, run, mode } = usePanel();
  const toast = useToast();
  const [d, setD] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const [posterError, setPosterError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const amount = parseAmount(d.price);
  const today = dateKey(new Date());
  const dateChanged = !initial.id || d.date !== initial.date;

  const errors = {
    title: d.title.trim().length < 3 ? "Ponle un nombre de al menos 3 letras" : null,
    date: !d.date ? "Elige la fecha" : dateChanged && d.date < today ? "La fecha ya pasó" : null,
    time: !TIME.test(d.start) || !TIME.test(d.end) ? "Indica la hora de inicio y de fin" : d.start === d.end ? "El concierto debe durar algo" : null,
    venue: d.venue.trim().length < 2 ? "Indica dónde será" : null,
    city: !d.city.trim() ? "Indica la ciudad" : null,
    price: d.priceMode === "pago" ? amount.error ?? (!amount.value ? "El precio debe ser mayor a cero" : null) : null,
    ticketUrl: d.ticketUrl && !/^https?:\/\/\S+\.\S+/.test(d.ticketUrl.trim()) ? "Pega un enlace completo, que empiece con https://" : null,
  };

  function pickPoster(file: File | undefined) {
    if (!file) return;
    const error = validateImage(file);
    setPosterError(error);
    if (error) return;
    if (d.posterUrl !== initial.posterUrl) revokeLocalUrl(d.posterUrl);
    set("posterUrl", createLocalUrl(file));
  }

  function save() {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    const title = d.title.trim();
    const concert: PanelConcert = {
      ...d,
      id: d.id || uid("co"),
      // The public address is fixed at creation so shared links keep working.
      slug: d.slug || concertSlug(ws.publicSlug, title, d.date, Math.random().toString(36).slice(2, 6)),
      title,
      description: d.description.trim(),
      venue: d.venue.trim(),
      city: d.city.trim(),
      address: d.address.trim(),
      ticketUrl: d.ticketUrl?.trim() || null,
      price: d.priceMode === "confirmar" ? null : d.priceMode === "libre" ? 0 : amount.value,
    };
    const exists = ws.concerts.some((c) => c.id === concert.id);
    const error = run((w) => ({ ...w, concerts: exists ? w.concerts.map((c) => (c.id === concert.id ? concert : c)) : [...w.concerts, concert] }));
    if (error) return toast({ tone: "error", title: "No se guardó", description: error });
    toast({ tone: "success", title: exists ? "Concierto actualizado" : "Concierto publicado", description: !concert.published ? "Quedó como borrador: solo tú lo ves." : mode === "demo" ? "En la demostración no se publica en la cartelera real." : "Aparecerá en la cartelera de VIBRA y en tu perfil en menos de un minuto." });
    onClose();
  }

  const preview = {
    title: d.title || "Tu concierto",
    date: d.date || today,
    start: TIME.test(d.start) ? d.start : "00:00",
    end: TIME.test(d.end) ? d.end : "00:00",
    venue: d.venue || "Lugar del concierto",
    city: d.city || "Ciudad",
    posterUrl: d.posterUrl,
  };

  return (
    <Modal
      open
      onOpenChange={(o) => !o && onClose()}
      size="xl"
      title={initial.id ? "Editar concierto" : "Nuevo concierto"}
      description="Se publica en la cartelera de VIBRA (/conciertos) y en tu perfil, con un afiche listo para compartir."
      footer={
        <>
          <PanelButton variant="ghost" onClick={onClose}>
            Cancelar
          </PanelButton>
          <PanelButton variant="primary" onClick={save}>
            {initial.id ? "Guardar cambios" : "Publicar concierto"}
          </PanelButton>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Nombre del concierto" htmlFor="co-title" error={submitted ? errors.title : null}>
            <TextInput id="co-title" value={d.title} onChange={(e) => set("title", e.target.value)} invalid={submitted && !!errors.title} autoFocus />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Fecha" htmlFor="co-date" error={submitted ? errors.date : null}>
              <TextInput id="co-date" type="date" min={today} value={d.date} onChange={(e) => set("date", e.target.value)} invalid={submitted && !!errors.date} className="[color-scheme:dark]" />
            </Field>
            <Field label="Empieza" htmlFor="co-start" error={submitted ? errors.time : null}>
              <TextInput id="co-start" type="time" value={d.start} onChange={(e) => set("start", e.target.value)} invalid={submitted && !!errors.time} className="[color-scheme:dark]" />
            </Field>
            <Field label="Termina" htmlFor="co-end" hint={TIME.test(d.start) && TIME.test(d.end) && d.end < d.start ? "Termina al día siguiente" : "Hora de Bolivia"}>
              <TextInput id="co-end" type="time" value={d.end} onChange={(e) => set("end", e.target.value)} className="[color-scheme:dark]" />
            </Field>
          </div>
          <Field label="Lugar" htmlFor="co-venue" error={submitted ? errors.venue : null}>
            <TextInput id="co-venue" value={d.venue} onChange={(e) => set("venue", e.target.value)} invalid={submitted && !!errors.venue} placeholder="Teatro Achá" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dirección (opcional)" htmlFor="co-address">
              <TextInput id="co-address" value={d.address} onChange={(e) => set("address", e.target.value)} placeholder="Calle España esq. Heroínas" />
            </Field>
            <Field label="Ciudad" htmlFor="co-city" error={submitted ? errors.city : null}>
              <TextInput id="co-city" value={d.city} onChange={(e) => set("city", e.target.value)} invalid={submitted && !!errors.city} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Entrada" htmlFor="co-price-mode">
              <Select id="co-price-mode" value={d.priceMode} onChange={(e) => set("priceMode", e.target.value as PriceMode)}>
                <option value="confirmar">Por confirmar</option>
                <option value="libre">Entrada libre</option>
                <option value="pago">Con precio</option>
              </Select>
            </Field>
            {d.priceMode === "pago" && (
              <Field label="Precio" htmlFor="co-price" error={submitted ? errors.price : null}>
                <MoneyInput id="co-price" value={d.price} onChange={(e) => set("price", e.target.value)} invalid={submitted && !!errors.price} />
              </Field>
            )}
          </div>
          <Field label="Enlace para comprar entradas (opcional)" htmlFor="co-ticket" error={submitted ? errors.ticketUrl : null}>
            <TextInput id="co-ticket" type="url" value={d.ticketUrl ?? ""} onChange={(e) => set("ticketUrl", e.target.value)} invalid={submitted && !!errors.ticketUrl} placeholder="https://" />
          </Field>
          <Field label="Descripción" htmlFor="co-desc">
            <TextArea id="co-desc" value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="Qué van a escuchar, invitados, cómo llegar…" />
          </Field>
          <Switch checked={d.published} onChange={(v) => set("published", v)} label="Publicado" description="Si lo apagas, queda como borrador y nadie más lo ve." />
          <button type="submit" hidden tabIndex={-1} />
        </form>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-mid">Afiche</p>
          <ConcertPoster concert={preview} artist={artistFor(ws)} sizes="320px" />
          <input ref={fileRef} type="file" accept={ACCEPT_ATTR} className="sr-only" onChange={(e) => pickPoster(e.target.files?.[0])} aria-label="Subir afiche propio" />
          <div className="flex flex-wrap gap-2">
            <PanelButton size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" /> {d.posterUrl ? "Cambiar afiche" : "Subir afiche propio"}
            </PanelButton>
            {d.posterUrl && (
              <PanelButton size="sm" variant="ghost" onClick={() => set("posterUrl", null)}>
                <X className="h-4 w-4" /> Usar el afiche de VIBRA
              </PanelButton>
            )}
          </div>
          {posterError ? <p className="text-xs text-red-300">{posterError}</p> : <p className="text-xs text-ink-mid">Opcional. Vertical 4:5, JPG, PNG o WebP de hasta 5 MB. Sin afiche propio, VIBRA arma este con tu foto.</p>}
        </div>
      </div>
    </Modal>
  );
}

function ConcertRow({ c, onEdit, onDelete, onDuplicate }: { c: PanelConcert; onEdit: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const { ws, mode } = usePanel();
  const d = concertDate(c.date);
  const past = !isUpcoming(c);
  return (
    <Card className={cn("flex flex-col gap-4 p-4 sm:flex-row sm:items-center", past && "opacity-70")}>
      <div className="w-28 shrink-0">
        <ConcertPoster concert={c} artist={artistFor(ws)} sizes="112px" className="rounded-xl" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", past ? "border-white/10 text-ink-mid" : c.published ? "border-volt bg-volt text-ink" : "border-white/20 text-ink-light")}>
            {past ? "Finalizado" : c.published ? "Publicado" : "Borrador"}
          </span>
          <span className="text-xs text-ink-mid">{priceText(c.price)}</span>
        </div>
        <h3 className="mt-2 truncate font-general text-lg font-semibold text-white">{c.title}</h3>
        <p className="mt-0.5 text-sm text-ink-light first-letter:uppercase">
          {d.long} · {c.start} a {c.end}
        </p>
        <p className="truncate text-sm text-ink-mid">
          {c.venue}, {c.city}
        </p>
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <span className="inline-flex items-center gap-1.5 text-sm text-white" title="Personas que marcaron «Me interesa»">
          <Heart className="h-4 w-4 text-volt" /> {c.interested.toLocaleString("es-BO")} <span className="text-ink-mid">fans</span>
        </span>
        <div className="flex items-center gap-1">
          {mode === "live" && c.published && (
            <a
              href={`/conciertos/${c.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver la página pública de ${c.title}`}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-ink-light hover:border-volt/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <ActionMenu
            label={`Acciones de ${c.title}`}
            items={[
              { label: "Editar", icon: Pencil, onSelect: onEdit },
              { label: "Duplicar para otra fecha", icon: Copy, onSelect: onDuplicate },
              "separator",
              { label: "Eliminar", icon: Trash2, onSelect: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
    </Card>
  );
}

export function ConcertsSection() {
  const { ws, run, mode } = usePanel();
  const toast = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<PanelConcert | null>(null);
  const sorted = [...ws.concerts].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const upcoming = sorted.filter((c) => isUpcoming(c));
  const past = sorted.filter((c) => !isUpcoming(c)).reverse();
  const fans = ws.concerts.reduce((s, c) => s + c.interested, 0);

  if (ws.kind !== "musica" && ws.kind !== "dj")
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader title="Conciertos" />
        <EmptyState icon={Mic2} title="Solo para músicos y DJs" description="La cartelera de conciertos está pensada para artistas que se presentan en vivo." />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Conciertos"
        description="Anuncia tus próximas presentaciones en la cartelera de VIBRA y suma fans en cada fecha."
        actions={
          <PanelButton variant="primary" onClick={() => setEditing(blank(ws))} disabled={!ws.concertsEnabled}>
            <Plus className="h-4 w-4" /> Nuevo concierto
          </PanelButton>
        }
      />
      {!ws.concertsEnabled && (
        <DemoNote>
          <strong className="text-ink-light">Falta activar los conciertos en la base de datos.</strong> Pide a VIBRA que ejecute la migración de conciertos;
          mientras tanto no se pueden crear.
        </DemoNote>
      )}
      {mode === "demo" && <DemoNote>En la demostración los conciertos viven solo en esta pestaña y no salen en la cartelera pública.</DemoNote>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <KpiCard index={0} icon={CalendarClock} label="Próximos conciertos" value={upcoming.length} hint={upcoming[0] ? `El próximo: ${concertDate(upcoming[0].date).day} ${concertDate(upcoming[0].date).monthShort}` : "Ninguno programado"} />
        <KpiCard index={1} icon={Heart} label="Fans interesados" value={fans} hint="Marcaron «Me interesa» en tus conciertos" accent={fans > 0} />
        <KpiCard index={2} icon={Mic2} label="Conciertos realizados" value={past.length} hint="Siguen visibles como historial" />
      </div>

      {ws.concerts.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="Todavía no anunciaste conciertos"
          description="Crea tu primer concierto: VIBRA arma el afiche con tu foto y lo publica en la cartelera para que tus fans lo encuentren."
          action={
            ws.concertsEnabled ? (
              <PanelButton variant="primary" onClick={() => setEditing(blank(ws))}>
                <Plus className="h-4 w-4" /> Crear concierto
              </PanelButton>
            ) : undefined
          }
        />
      ) : (
        <>
          {[
            { title: "Próximos", items: upcoming },
            { title: "Realizados", items: past },
          ]
            .filter((g) => g.items.length)
            .map((g) => (
              <div key={g.title} className="flex flex-col gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-mid">{g.title}</h2>
                {g.items.map((c) => (
                  <ConcertRow
                    key={c.id}
                    c={c}
                    onEdit={() => setEditing(toDraft(c))}
                    onDuplicate={() => setEditing({ ...toDraft(c), id: "", slug: "", date: "", interested: 0 })}
                    onDelete={() => setDeleting(c)}
                  />
                ))}
              </div>
            ))}
        </>
      )}

      {editing && <ConcertForm initial={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="¿Eliminar el concierto?"
        confirmLabel="Eliminar"
        description={deleting ? `“${deleting.title}” desaparecerá de la cartelera y se perderá su contador de ${deleting.interested} fans.` : ""}
        onConfirm={() => {
          if (!deleting) return;
          run((w) => ({ ...w, concerts: w.concerts.filter((c) => c.id !== deleting.id) }));
          toast({ tone: "success", title: "Concierto eliminado" });
          setDeleting(null);
        }}
      />
    </div>
  );
}
