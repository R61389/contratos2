"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { BadgeCheck, ChevronLeft, ChevronRight, Users } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/provider/stars";

const INTERVAL = 7000;
const EASE = [0.16, 1, 0.3, 1] as const;

export function CateringTestimonials({ provider }: { provider: Provider }) {
  const items = provider.catering!.testimonials;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const t = items[index];

  useEffect(() => {
    if (paused || reduce) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % items.length), INTERVAL);
    return () => clearTimeout(id);
  }, [index, paused, reduce, items.length]);

  const go = (delta: number) => setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <section id="opiniones" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Testimonios"
            title={
              <>
                Lo que se quedó <span className="font-serif font-normal italic">en la memoria</span>
              </>
            }
            titleClassName="font-general"
          />
          <div className="flex items-center gap-4">
            <span className="font-general text-5xl font-semibold text-white">{provider.rating.toFixed(1)}</span>
            <span>
              <Stars rating={provider.rating} className="text-lg" />
              <span className="mt-1 block text-xs text-ink-mid">{provider.reviewsCount} reseñas verificadas</span>
            </span>
          </div>
        </div>

        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="glass relative mt-12 grid overflow-hidden rounded-[2.5rem] shadow-card lg:grid-cols-[1fr_1.15fr]"
        >
          <div className="relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[520px]">
            <AnimatePresence initial={false}>
              <motion.div
                key={t.photo + index}
                initial={{ opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1.02 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.9 }, scale: { duration: INTERVAL / 1000 + 1, ease: "linear" } }}
                className="absolute inset-0"
              >
                <Image src={t.photo} alt={`Evento: ${t.event}`} fill sizes="(max-width: 1024px) 100vw, 520px" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-ink/40" />
            <span className="glass-strong absolute bottom-5 left-5 flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white">
              <Users className="h-3.5 w-3.5 text-volt" />
              {t.event} · {t.guests} invitados
            </span>
          </div>

          <div className="relative flex flex-col justify-between gap-10 p-7 sm:p-12">
            <span aria-hidden className="pointer-events-none absolute right-8 top-2 font-serif text-[12rem] leading-none text-white/[0.05]">
              “
            </span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.figure
                key={index}
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
                transition={{ duration: 0.6, ease: EASE }}
                className="relative"
              >
                <Stars rating={t.rating} className="text-base" />
                <blockquote className="mt-6 text-balance font-serif text-3xl leading-[1.15] text-white sm:text-4xl">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-volt to-volt/40 font-general text-sm font-semibold text-ink">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-white">{t.name}</span>
                    <span className="block text-xs text-ink-mid">
                      {t.event} · {t.date}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-volt" title="Evento verificado por VIBRA">
                    <BadgeCheck className="h-4 w-4" />
                    Verificado
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>

            <div className="flex items-center gap-4">
              <div className="flex flex-1 gap-1.5">
                {items.map((item, i) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Testimonio de ${item.name}`}
                    aria-current={i === index}
                    className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10"
                  >
                    {i < index && <span className="absolute inset-0 bg-volt/50" />}
                    {i === index && (
                      <motion.span
                        key={`${index}-${paused}`}
                        initial={{ scaleX: paused || reduce ? 1 : 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: paused || reduce ? 0 : INTERVAL / 1000, ease: "linear" }}
                        className="absolute inset-0 origin-left bg-volt"
                      />
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {[
                  { d: -1, icon: ChevronLeft, label: "Testimonio anterior" },
                  { d: 1, icon: ChevronRight, label: "Testimonio siguiente" },
                ].map(({ d, icon: Icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => go(d)}
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
