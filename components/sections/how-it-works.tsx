"use client";

import { motion } from "motion/react";
import { ClipboardList, Sparkles, ListChecks, CalendarCheck } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const STEPS = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Describe tu evento",
    desc: "Cuéntanos el tipo de evento, fecha, invitados y presupuesto estimado.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Recibe recomendaciones",
    desc: "Nuestro sistema sugiere proveedores ideales según tu estilo y ciudad.",
  },
  {
    icon: ListChecks,
    step: "03",
    title: "Compara proveedores",
    desc: "Revisa precios, calificaciones y disponibilidad en un solo lugar.",
  },
  {
    icon: CalendarCheck,
    step: "04",
    title: "Reserva y organiza",
    desc: "Confirma todo tu evento desde el mismo panel, sin complicaciones.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="De la idea a la celebración en 4 pasos"
          description="Un proceso simple, pensado para que organices tu evento sin estrés."
        />

        <div className="relative mt-20">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-ink-light/15 to-transparent lg:block" />

          <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                className="relative flex flex-col items-center gap-4 text-center"
              >
                <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-volt/20 bg-volt/5">
                  <step.icon className="h-8 w-8 text-volt" strokeWidth={1.5} />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-volt text-[11px] font-bold text-ink shadow-glow">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="max-w-[240px] text-sm text-ink-mid">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
