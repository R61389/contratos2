"use client";

import { motion } from "motion/react";
import { ArrowRight, Clock, Tag } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/utils";

const WEEK = [
  { d: "Lun", on: true },
  { d: "Mar", on: true },
  { d: "Mié", on: true },
  { d: "Jue", on: true },
  { d: "Vie", on: false },
  { d: "Sáb", on: false },
  { d: "Dom", on: false },
];

export function Promo({ provider }: { provider: Provider }) {
  const { promo } = provider;
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-strong relative overflow-hidden rounded-[2rem] border-volt/40 p-8 shadow-glow-lg sm:p-12"
          >
            <motion.div
              aria-hidden
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-volt/25 blur-[90px]"
            />
            <motion.div
              aria-hidden
              style={{ skewX: -12 }}
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />

            <div className="relative grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-volt px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                  <Tag className="h-3.5 w-3.5" />
                  {promo.title}
                </span>
                <p className="mt-6 font-general text-7xl font-bold leading-none tracking-tight text-volt drop-shadow-[0_0_30px_rgba(226,232,0,0.35)] sm:text-8xl md:text-9xl">
                  {promo.discount}%<span className="ml-3 align-top text-3xl text-white sm:text-4xl">OFF</span>
                </p>
                <p className="mt-5 text-lg text-white sm:text-xl">{promo.description}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-ink-mid">
                  <Clock className="h-4 w-4" />
                  Válido hasta el {promo.validUntil}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-7 gap-1.5">
                  {WEEK.map((w, i) => (
                    <motion.div
                      key={w.d}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-2xl border py-3 text-xs font-semibold",
                        w.on ? "border-volt/50 bg-volt/15 text-volt" : "border-ink-light/10 text-ink-mid/60"
                      )}
                    >
                      {w.d}
                      <span className={cn("h-1.5 w-1.5 rounded-full", w.on ? "bg-volt" : "bg-ink-mid/30")} />
                    </motion.div>
                  ))}
                </div>
                <MagneticButton size="lg" asChild className="group w-full" wrapperClassName="block w-full">
                  <a href="#disponibilidad">
                    Aprovechar oferta
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </MagneticButton>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
