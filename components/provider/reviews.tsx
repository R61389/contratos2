"use client";

import { motion } from "motion/react";
import { BadgeCheck, Quote } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/components/provider/stars";
import { cn } from "@/lib/utils";

function distribution(rating: number) {
  const five = Math.round(Math.min(96, Math.max(40, (rating - 4) * 100 - 2)));
  const four = Math.round((100 - five) * 0.7);
  const three = Math.round((100 - five - four) * 0.7);
  const two = Math.max(0, 100 - five - four - three - 1);
  return [five, four, three, two, 100 - five - four - three - two];
}

export function Reviews({ provider }: { provider: Provider }) {
  const dist = distribution(provider.rating);
  return (
    <section id="opiniones" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.6fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <SectionHeading
              align="left"
              eyebrow="Opiniones"
              title="Lo que dicen quienes ya lo vivieron"
              titleClassName="font-general"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass mt-8 rounded-3xl p-6"
            >
              <div className="flex items-end gap-4">
                <span className="font-general text-6xl font-semibold leading-none text-white">{provider.rating.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars rating={provider.rating} className="text-lg" />
                  <p className="mt-1 text-xs text-ink-mid">{provider.reviewsCount} reseñas verificadas</p>
                </div>
              </div>
              <div className="mt-6 grid gap-2.5">
                {dist.map((pct, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-ink-mid">
                    <span className="w-3 text-right">{5 - i}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                        className={cn("h-full rounded-full", i === 0 ? "bg-volt" : "bg-ink-light/40")}
                      />
                    </div>
                    <span className="w-8 tabular-nums">{pct}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {provider.reviews.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: (i % 2) * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={cn(i % 2 === 1 && "sm:mt-10")}
              >
                <motion.figure
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="glass group relative flex h-full flex-col gap-4 rounded-3xl p-6 shadow-card transition-colors duration-500 hover:border-volt/30"
                >
                  <Quote className="absolute right-5 top-5 h-8 w-8 text-white/[0.06] transition-colors duration-500 group-hover:text-volt/30" />
                  <Stars rating={r.rating} className="text-sm" />
                  <blockquote className="flex-1 text-[15px] leading-relaxed text-ink-light">“{r.quote}”</blockquote>
                  <figcaption className="flex items-center gap-3 border-t border-ink-light/10 pt-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-volt to-volt/40 font-general text-sm font-semibold text-ink">
                      {r.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{r.name}</span>
                      <span className="block text-xs text-ink-mid">
                        {r.event} · {r.date}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-volt" title="Evento verificado por VIBRA">
                      <BadgeCheck className="h-4 w-4" />
                      <span className="hidden sm:inline">Verificado</span>
                    </span>
                  </figcaption>
                </motion.figure>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
