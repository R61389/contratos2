"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Star, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const TESTIMONIALS = [
  {
    name: "Valeria Rocha",
    role: "Cumpleaños de 25",
    quote:
      "Organicé todo mi cumpleaños desde el celular. DJ, catering y decoración en menos de una hora. Increíble.",
    rating: 5,
  },
  {
    name: "Diego Fernández",
    role: "Matrimonio",
    quote:
      "Comparamos 6 grupos musicales y 4 caterings en minutos. Nos ahorramos semanas de búsqueda.",
    rating: 5,
  },
  {
    name: "Camila Torrez",
    role: "Evento corporativo",
    quote:
      "La plataforma se siente premium de verdad. Los proveedores llegaron puntuales y el evento fue un éxito.",
    rating: 5,
  },
  {
    name: "Andrés Quiroga",
    role: "Fiesta de graduación",
    quote:
      "El paquete completo valió cada boliviano. Sonido, luces y animación coordinados perfectamente.",
    rating: 4,
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading
          eyebrow="Testimonios"
          title="Miles de eventos, una sola experiencia"
          description="Esto dicen quienes ya organizaron su evento con nosotros."
        />

        <div className="relative mt-16 min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong flex flex-col items-center gap-6 rounded-3xl px-8 py-12 text-center shadow-card sm:px-14"
            >
              <Quote className="h-8 w-8 text-volt" />
              <p className="text-balance text-lg text-white sm:text-xl">
                “{TESTIMONIALS[index].quote}”
              </p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < TESTIMONIALS[index].rating
                        ? "fill-volt text-volt"
                        : "text-ink-light/20"
                    }`}
                  />
                ))}
              </div>
              <div>
                <p className="font-medium text-white">{TESTIMONIALS[index].name}</p>
                <p className="text-sm text-ink-mid">{TESTIMONIALS[index].role}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ver testimonio ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-volt" : "w-1.5 bg-ink-light/20"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
