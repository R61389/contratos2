"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarPlus, Check, Heart, Link2, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { googleCalendarUrl, icsFile, type Concert } from "@/lib/concerts";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const button =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-4 text-sm text-ink-light transition-colors hover:border-volt/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt";

function fansText(n: number) {
  if (n === 0) return "Sé la primera persona en sumarte";
  return n === 1 ? "1 fan interesado" : `${n.toLocaleString("es-BO")} fans interesados`;
}

/** "Me interesa": the fan count artists see in their panel. One mark per browser. */
export function InterestButton({ slug, initial, className }: { slug: string; initial: number; className?: string }) {
  const key = `vibra:interes:${slug}`;
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const marked = localStorage.getItem(key) === "1";
      setOn(marked);
      // Without a database the count lives only here, so this browser's own mark is added on top.
      if (marked && !isSupabaseConfigured()) setCount(initial + 1);
    } catch {}
  }, [key, initial]);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setBusy(true);
    setOn(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await getBrowserClient().rpc("concert_interest", { concert_slug: slug, interested: next });
        if (error) throw error;
        setCount(Number(data));
      }
      try {
        if (next) localStorage.setItem(key, "1");
        else localStorage.removeItem(key);
      } catch {}
    } catch {
      setOn(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        disabled={busy}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          on ? "border border-volt bg-volt/10 text-volt" : "bg-volt text-ink shadow-glow hover:brightness-110"
        )}
      >
        <motion.span key={String(on)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          {on ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
        </motion.span>
        {on ? "Te interesa" : "Me interesa"}
      </button>
      <span className="text-sm text-ink-mid" aria-live="polite">
        {fansText(count)}
      </span>
    </div>
  );
}

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

export function Countdown({ start, end, className }: { start: string; end: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();

  if (now !== null && now >= endMs) return <p className={cn("text-sm text-ink-mid", className)}>Este concierto ya terminó.</p>;
  if (now !== null && now >= startMs)
    return (
      <p className={cn("inline-flex items-center gap-2 text-sm font-semibold text-volt", className)}>
        <span className="h-2 w-2 animate-pulse rounded-full bg-volt" /> En vivo ahora
      </p>
    );

  const left = split(now === null ? 0 : startMs - now);
  const units = [
    { label: "días", value: left.days },
    { label: "horas", value: left.hours },
    { label: "min", value: left.minutes },
    { label: "seg", value: left.seconds },
  ];
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)} aria-label="Cuenta regresiva para el concierto" role="timer">
      {units.map((u) => (
        <div key={u.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center">
          <span className="block font-display text-3xl font-black tabular-nums text-white">{now === null ? "--" : String(u.value).padStart(2, "0")}</span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-ink-mid">{u.label}</span>
        </div>
      ))}
    </div>
  );
}

export function CalendarButtons({ concert, artistName }: { concert: Concert; artistName: string }) {
  function download() {
    const blob = new Blob([icsFile(concert, artistName, location.href)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${concert.slug}.ics` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => window.open(googleCalendarUrl(concert, artistName, location.href), "_blank", "noopener")} className={button}>
        <CalendarPlus className="h-4 w-4" /> Google Calendar
      </button>
      <button type="button" onClick={download} className={button}>
        <CalendarPlus className="h-4 w-4" /> Apple / Outlook (.ics)
      </button>
    </div>
  );
}

export function ShareButtons({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare(typeof navigator !== "undefined" && "share" in navigator), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${location.href}`)}`, "_blank", "noopener")} className={button}>
        <WhatsAppIcon className="h-4 w-4" /> WhatsApp
      </button>
      <button type="button" onClick={copy} className={button}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={String(copied)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="inline-flex items-center gap-2">
            {copied ? <Check className="h-4 w-4 text-volt" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </motion.span>
        </AnimatePresence>
      </button>
      {canShare && (
        <button type="button" onClick={() => navigator.share({ title: text, url: location.href }).catch(() => {})} className={button}>
          <Share2 className="h-4 w-4" /> Compartir
        </button>
      )}
    </div>
  );
}
