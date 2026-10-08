"use client";

import { motion } from "motion/react";
import { ArrowRight, Briefcase, Clock, Sparkles } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePlanner } from "@/components/catering/planner";

export function CateringPromo({ provider }: { provider: Provider }) {
  const { promo } = provider;
  const { perks } = provider.catering!;
  const { setCorporate } = usePlanner();

  return (
    <section id="promociones" className="relative scroll-mt-24 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-5 px-6 lg:grid-cols-[1.5fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="glass-strong relative h-full overflow-hidden rounded-[2.5rem] border-volt/40 p-8 shadow-glow-lg sm:p-12"
          >
            <motion.div
              aria-hidden
              animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.15, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-volt/30 blur-[100px]"
            />
            <motion.div
              aria-hidden
              style={{ skewX: -12 }}
              initial={{ x: "-120%" }}
              animate={{ x: "320%" }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-volt px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
                <Briefcase className="h-3.5 w-3.5" />
                {promo.title}
              </span>
              <p className="mt-8 font-general text-8xl font-bold leading-[0.85] tracking-tight text-volt drop-shadow-[0_0_40px_rgba(226,232,0,0.45)] sm:text-[10rem]">
                {promo.discount}%
                <span className="ml-3 align-top font-serif text-4xl font-normal italic text-white sm:text-5xl">off</span>
              </p>
              <p className="mt-6 max-w-md font-serif text-3xl leading-tight text-white sm:text-4xl">Para eventos corporativos</p>
              <p className="mt-3 text-ink-light/80">{promo.description}</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <MagneticButton size="lg" asChild className="group">
                  <a href="#calculadora" onClick={() => setCorporate(true)}>
                    Aplicar a mi cotización
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </MagneticButton>
                <span className="flex items-center gap-2 text-sm text-ink-mid">
                  <Clock className="h-4 w-4" />
                  Válido hasta el {promo.validUntil}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid gap-5">
          {perks.map((perk, i) => (
            <motion.div
              key={perk.title}
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
                className="glass group flex h-full items-center gap-5 rounded-3xl p-6 transition-colors duration-500 hover:border-volt/40"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-volt/10 text-volt transition-all duration-500 group-hover:bg-volt group-hover:text-ink group-hover:shadow-glow">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-serif text-2xl leading-tight text-white">{perk.title}</span>
                  <span className="mt-1 block text-sm text-ink-mid">{perk.description}</span>
                </span>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
