"use client";

import { motion } from "motion/react";
import { Search, MessageCircleWarning, Clock, Frown, Sparkles, Check } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const PROBLEMS = [
  { icon: Search, text: "Buscar músicos en un grupo de Facebook" },
  { icon: MessageCircleWarning, text: "Cotizar catering por WhatsApp sin respuesta" },
  { icon: Clock, text: "Perder horas coordinando decoración y sonido" },
  { icon: Frown, text: "No saber si el proveedor es confiable" },
];

const SOLUTIONS = [
  "Todos los proveedores verificados en un solo lugar",
  "Cotizaciones y disponibilidad en tiempo real",
  "Compara precios, estilos y calificaciones al instante",
  "Reserva y coordina tu evento completo sin salir de la app",
];

export function ProblemSolution() {
  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="El problema"
          title="Organizar un evento no debería sentirse como un trabajo extra"
          description="Hoy los usuarios buscan música, catering, decoración y bebidas por separado, en decenas de chats, grupos y llamadas."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {PROBLEMS.map((item, i) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass flex items-center gap-4 rounded-2xl px-5 py-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-ink-mid">
                <item.icon className="h-5 w-5" />
              </span>
              <p className="text-sm text-ink-light sm:text-base">{item.text}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto my-16 flex w-fit items-center gap-3 rounded-full border border-volt/30 bg-volt/5 px-6 py-3"
        >
          <Sparkles className="h-4 w-4 text-volt" />
          <span className="text-sm font-medium text-volt">
            La solución: todo centralizado en Eventos CBBA
          </span>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {SOLUTIONS.map((text, i) => (
            <motion.div
              key={text}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass-strong flex items-center gap-4 rounded-2xl px-5 py-4 shadow-card"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-volt/15 text-volt">
                <Check className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <p className="text-sm text-white sm:text-base">{text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
