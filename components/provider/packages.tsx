"use client";

import { motion } from "motion/react";
import { Check, Clock, Crown } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatBs, whatsappLink } from "@/lib/format";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Packages({ provider }: { provider: Provider }) {
  return (
    <section id="paquetes" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Paquetes"
          title="Elige cómo quieres vivirlo"
          description="Precios claros, sin sorpresas. Todos los paquetes se pueden personalizar."
          titleClassName="font-general"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-center">
          {provider.packages.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8 }}
              className={cn(
                "relative flex flex-col rounded-3xl p-7 sm:p-8",
                pkg.recommended
                  ? "glass-strong z-10 border-volt/50 shadow-glow-lg lg:-my-4 lg:py-12"
                  : "glass shadow-card"
              )}
            >
              {pkg.recommended && (
                <>
                  <motion.div
                    aria-hidden
                    animate={{ opacity: [0.35, 0.7, 0.35] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-volt to-transparent"
                  />
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-volt px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-ink shadow-glow">
                    <Crown className="h-3.5 w-3.5" />
                    Recomendado
                  </span>
                </>
              )}

              <p className="font-general text-sm font-semibold uppercase tracking-[0.2em] text-ink-mid">{pkg.name}</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className={cn("font-general text-5xl font-semibold tracking-tight", pkg.recommended ? "text-volt" : "text-white")}>
                  {formatBs(pkg.price)}
                </span>
                {pkg.unit && <span className="text-sm text-ink-mid">{pkg.unit}</span>}
              </p>
              <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-ink-light/10 px-3 py-1 text-xs text-ink-light">
                <Clock className="h-3.5 w-3.5 text-volt" />
                {pkg.duration}
              </p>

              <ul className="mt-7 flex flex-1 flex-col gap-3">
                {pkg.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-sm text-ink-light">
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", pkg.recommended ? "bg-volt" : "bg-white/10")}>
                      <Check className={cn("h-3 w-3", pkg.recommended ? "text-ink" : "text-volt")} strokeWidth={3} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>

              <Button asChild variant={pkg.recommended ? "primary" : "secondary"} className="mt-8 w-full">
                <a
                  href={whatsappLink(provider.whatsapp, `Hola ${provider.fullName}, me interesa el ${pkg.name} (vi el perfil en VIBRA).`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reservar {pkg.name.replace("Paquete ", "")}
                </a>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
