"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PACKAGES = [
  {
    name: "Paquete Básico",
    price: "Desde Bs 3,500",
    desc: "Ideal para reuniones íntimas",
    features: ["DJ o música ambiental", "Decoración esencial", "Sonido básico", "Soporte por chat"],
    highlight: false,
  },
  {
    name: "Paquete Fiesta",
    price: "Desde Bs 7,800",
    desc: "Para celebraciones con energía",
    features: ["Grupo musical o DJ", "Decoración temática", "Catering para 50 personas", "Sonido e iluminación"],
    highlight: false,
  },
  {
    name: "Paquete Completo",
    price: "Desde Bs 14,900",
    desc: "La experiencia todo incluido",
    features: [
      "Grupo musical + DJ",
      "Catering premium",
      "Decoración completa",
      "Fotografía profesional",
      "Sonido e iluminación full",
      "Coordinador de evento",
    ],
    highlight: true,
  },
  {
    name: "Paquete Premium",
    price: "Desde Bs 22,500",
    desc: "Para eventos inolvidables",
    features: ["Todo lo del Completo", "Salón de eventos incluido", "Barra libre artesanal", "Animación en vivo"],
    highlight: false,
  },
];

export function Packages() {
  return (
    <section id="paquetes" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Paquetes"
          title="Elige el paquete perfecto para tu evento"
          description="Combinaciones pensadas por nuestro equipo, o arma tu propio plan a la medida."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-4">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col gap-6 rounded-2xl p-7",
                pkg.highlight
                  ? "glass-strong border border-volt/40 shadow-glow-lg lg:-translate-y-4"
                  : "glass shadow-card"
              )}
            >
              {pkg.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-volt px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-ink shadow-glow">
                  Más popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                <p className="mt-1 text-sm text-ink-mid">{pkg.desc}</p>
              </div>

              <p className={cn("text-2xl font-semibold", pkg.highlight ? "text-volt" : "text-white")}>
                {pkg.price}
              </p>

              <ul className="flex flex-1 flex-col gap-3">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-ink-light">
                    <Check
                      className={cn("mt-0.5 h-4 w-4 shrink-0", pkg.highlight ? "text-volt" : "text-ink-mid")}
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant={pkg.highlight ? "primary" : "secondary"} className="w-full">
                Elegir paquete
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
