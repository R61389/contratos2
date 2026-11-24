"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Send, X } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatBs } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBrowserClient } from "@/lib/supabase/client";
import { fromDateKey } from "@/components/builder/use-draft";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RequestItem {
  serviceLabel: string;
  provider: Provider;
  price: number;
}

type Result = { slug: string; ok: boolean; error?: string };

const input =
  "h-12 w-full rounded-2xl border border-ink-light/15 bg-white/[0.03] px-4 text-sm text-white placeholder:text-ink-mid/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-volt [color-scheme:dark]";

function isoDate(key: string | null) {
  const d = fromDateKey(key);
  if (!d) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Sends one booking request per chosen provider; each one accepts or rejects it from their VIBRA panel. */
export function SendRequests({ items, eventType, dateKey, guests }: { items: RequestItem[]; eventType: string; dateKey: string | null; guests: number }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", start: "20:00", end: "02:00", venue: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const date = isoDate(dateKey);
  const today = isoDate(`${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`)!;
  const digits = form.phone.replace(/\D/g, "");
  const errors = {
    name: form.name.trim().length < 2 ? "Escribe tu nombre" : null,
    phone: digits.length < 7 || digits.length > 15 ? "Escribe un número de WhatsApp válido" : null,
    email: form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim()) ? "Revisa el correo" : null,
    time: !form.start || !form.end || form.start === form.end ? "Indica el horario" : null,
    date: !date ? "Elige la fecha del evento en el paso 2" : date < today ? "La fecha del evento ya pasó" : null,
  };
  const sent = results?.filter((r) => r.ok).length ?? 0;
  const demo = !isSupabaseConfigured();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    setSending(true);
    // Bolivian numbers are written locally with 8 digits; the panel stores them with the country code.
    const phone = digits.length === 8 ? `591${digits}` : digits;
    const out: Result[] = [];
    for (const item of items) {
      if (demo) {
        await new Promise((r) => setTimeout(r, 250));
        out.push({ slug: item.provider.slug, ok: true });
        continue;
      }
      const { error } = await getBrowserClient().rpc("submit_booking_request", {
        provider_slug: item.provider.slug,
        client_name: form.name.trim(),
        client_phone: phone,
        client_email: form.email.trim(),
        event_type: eventType,
        event_date: date,
        start_time: form.start,
        end_time: form.end,
        guests,
        venue: form.venue.trim(),
        service_name: item.serviceLabel,
        proposed_price: item.price,
        message: form.message.trim(),
      });
      out.push({ slug: item.provider.slug, ok: !error, error: error?.message.includes("function") ? "El envío todavía no está activado en este sitio." : error?.message });
    }
    setResults(out);
    setSending(false);
  }

  if (results && sent > 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl border border-volt/40 bg-volt/[0.06] p-6" role="status">
        <p className="flex items-center gap-2 font-general text-lg font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-volt text-ink">
            <Check className="h-4 w-4" />
          </span>
          {sent === items.length ? `Solicitud enviada a ${sent} proveedores` : `Solicitud enviada a ${sent} de ${items.length} proveedores`}
        </p>
        <p className="mt-2 text-sm text-ink-light">
          Cada proveedor la verá en su panel de VIBRA y te responderá por WhatsApp para confirmar fecha y precio.
          {demo && " En esta demostración no se envía ninguna solicitud real."}
        </p>
        <ul className="mt-4 grid gap-2">
          {items.map((item) => {
            const r = results.find((x) => x.slug === item.provider.slug);
            return (
              <li key={item.provider.slug} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-white">{item.provider.fullName}</span>
                <span className={cn("flex items-center gap-1.5", r?.ok ? "text-volt" : "text-red-300")}>
                  {r?.ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {r?.ok ? "Enviada" : r?.error ?? "No se pudo enviar"}
                </span>
              </li>
            );
          })}
        </ul>
      </motion.div>
    );
  }

  return (
    <div className="mt-8">
      {!open ? (
        <Button type="button" size="lg" onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Send className="h-4 w-4" />
          Enviar solicitud a {items.length === 1 ? "este proveedor" : `los ${items.length} proveedores`}
        </Button>
      ) : (
        <AnimatePresence>
          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={submit}
            noValidate
            className="glass rounded-3xl p-5 sm:p-6"
            aria-label="Enviar solicitud de reserva"
          >
            <p className="font-general text-lg font-semibold text-white">Tus datos para la solicitud</p>
            <p className="mt-1 text-sm text-ink-mid">
              Se enviará una solicitud a {items.map((i) => i.provider.fullName).join(", ")}. Cada uno la confirma desde su panel.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" error={submitted ? errors.name : null}>
                <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" placeholder="Tu nombre" />
              </Field>
              <Field label="WhatsApp" error={submitted ? errors.phone : null}>
                <input className={input} value={form.phone} onChange={(e) => set("phone", e.target.value)} inputMode="tel" autoComplete="tel" placeholder="7XXXXXXX" />
              </Field>
              <Field label="Correo (opcional)" error={submitted ? errors.email : null}>
                <input className={input} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" placeholder="tucorreo@gmail.com" />
              </Field>
              <Field label="Lugar (opcional)">
                <input className={input} value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Salón, dirección o zona" />
              </Field>
              <Field label="Hora de inicio" error={submitted ? errors.time : null}>
                <input className={input} type="time" value={form.start} onChange={(e) => set("start", e.target.value)} />
              </Field>
              <Field label="Hora de fin" hint={form.end && form.start && form.end < form.start ? "Termina al día siguiente" : undefined}>
                <input className={input} type="time" value={form.end} onChange={(e) => set("end", e.target.value)} />
              </Field>
            </div>
            <Field label="Mensaje para los proveedores (opcional)" className="mt-4">
              <textarea className={cn(input, "h-24 resize-none py-3")} value={form.message} onChange={(e) => set("message", e.target.value)} maxLength={1000} placeholder="Detalles que deban saber" />
            </Field>
            {submitted && errors.date && <p className="mt-4 text-sm text-red-300">{errors.date}</p>}
            {results && sent === 0 && <p className="mt-4 text-sm text-red-300">{results[0]?.error ?? "No se pudo enviar la solicitud. Inténtalo de nuevo."}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? "Enviando…" : "Enviar solicitudes"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={sending}>
                Cancelar
              </Button>
              <span className="text-xs text-ink-mid">Total estimado {formatBs(items.reduce((s, i) => s + i.price, 0))}</span>
            </div>
          </motion.form>
        </AnimatePresence>
      )}
    </div>
  );
}

function Field({ label, error, hint, className, children }: { label: string; error?: string | null; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-mid">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-300">{error}</span> : hint ? <span className="text-xs text-ink-mid">{hint}</span> : null}
    </label>
  );
}
