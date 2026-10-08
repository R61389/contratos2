"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "motion/react";
import { ClipboardList, CookingPot, ConciergeBell, Sparkles, UtensilsCrossed } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const STEPS = [
  { icon: ClipboardList, title: "Planificación", text: "Una reunión para entender tu evento: invitados, horarios, espacio y restricciones alimentarias." },
  { icon: UtensilsCrossed, title: "Selección del menú", text: "Diseñamos la carta contigo y, para eventos grandes, te invitamos a una degustación previa." },
  { icon: CookingPot, title: "Preparación", text: "Cocinamos el mismo día con producto fresco del valle, en cocina propia y con estándares de inocuidad." },
  { icon: ConciergeBell, title: "Servicio", text: "Montaje, chefs y meseros uniformados. Cada tiempo llega a la mesa a la temperatura justa." },
  { icon: Sparkles, title: "Limpieza", text: "Retiramos vajilla, mantelería y residuos. Tú solo te quedas con el recuerdo." },
];

export function ExperienceTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <section id="experiencia" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading
          eyebrow="Experiencia gastronómica"
          title={
            <>
              De la primera llamada <span className="font-serif font-normal italic">al último plato</span>
            </>
          }
          description="Un proceso probado en cientos de eventos, para que tú solo pienses en disfrutar."
          titleClassName="font-general"
        />

        <ol ref={ref} className="relative mt-16">
          {/* Rail and its scroll-driven fill */}
          <span aria-hidden className="absolute bottom-0 left-6 top-0 w-px bg-ink-light/10 md:left-1/2" />
          <motion.span
            aria-hidden
            style={{ scaleY: progress }}
            className="absolute bottom-0 left-6 top-0 w-px origin-top bg-gradient-to-b from-volt via-volt to-volt/0 shadow-glow md:left-1/2"
          />

          {STEPS.map(({ icon: Icon, title, text }, i) => {
            const right = i % 2 === 1;
            return (
              <li key={title} className="relative grid pb-14 last:pb-0 md:grid-cols-2 md:gap-16">
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-35% 0px" }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="absolute left-6 top-1 z-10 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border border-volt/50 bg-ink text-volt shadow-glow md:left-1/2"
                >
                  <Icon className="h-5 w-5" />
                </motion.span>
                <motion.div
                  initial={{ opacity: 0, x: right ? 50 : -50, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-30% 0px" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("pl-16 md:pl-0", right ? "md:col-start-2" : "md:pr-4 md:text-right")}
                >
                  <span className="font-general text-sm font-semibold text-volt">0{i + 1}</span>
                  <h3 className="mt-1 font-serif text-4xl leading-none text-white sm:text-5xl">{title}</h3>
                  <p className="mt-3 text-ink-mid">{text}</p>
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
