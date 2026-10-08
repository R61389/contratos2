"use client";

import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { ArrowRight, CakeSlice, Clock, CookingPot, Salad, Users, Wine } from "lucide-react";
import type { MenuCourses, Provider } from "@/lib/providers";
import { formatBs } from "@/lib/format";
import { SectionHeading } from "@/components/ui/section-heading";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { usePlanner } from "@/components/catering/planner";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const COURSES: { key: keyof MenuCourses; label: string; icon: typeof Salad }[] = [
  { key: "entradas", label: "Entradas", icon: Salad },
  { key: "principal", label: "Plato principal", icon: CookingPot },
  { key: "postres", label: "Postres", icon: CakeSlice },
  { key: "bebidas", label: "Bebidas", icon: Wine },
];

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } };
const row: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: EASE } },
};

export function MenuShowcase({ provider }: { provider: Provider }) {
  const { menu, setMenuId } = usePlanner();
  const menus = provider.catering!.menus;

  return (
    <section id="carta" className="relative scroll-mt-24 py-24 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-light/15 to-transparent" />
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="La carta"
          title={
            <>
              Cada tiempo, <span className="font-serif font-normal italic">pensado al detalle</span>
            </>
          }
          titleClassName="font-general"
        />

        {/* Segmented control */}
        <div className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Elegir menú"
            className="scrollbar-none glass -mx-6 flex max-w-[calc(100%+3rem)] gap-1 overflow-x-auto rounded-full p-1.5 sm:mx-0 sm:max-w-full"
          >
            {menus.map((m) => (
              <button
                key={m.id}
                role="tab"
                aria-selected={menu.id === m.id}
                onClick={() => setMenuId(m.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-300",
                  menu.id === m.id ? "text-ink" : "text-ink-light hover:text-white"
                )}
              >
                {menu.id === m.id && (
                  <motion.span
                    layoutId="menu-tab"
                    className="absolute inset-0 rounded-full bg-volt"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14">
          {/* Product shot */}
          <div className="relative aspect-[4/3.4] overflow-hidden rounded-[2.5rem] shadow-card ring-1 ring-white/10">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, scale: 1.12, filter: "blur(12px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
                transition={{ duration: 0.9, ease: EASE }}
                className="absolute inset-0"
              >
                <Image src={menu.image} alt={menu.name} fill sizes="(max-width: 1024px) 100vw, 600px" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="glass-strong absolute bottom-5 left-5 rounded-2xl px-5 py-4"
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-mid">Por persona</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={menu.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="font-general text-3xl font-semibold text-volt"
                >
                  {formatBs(menu.pricePerPerson)}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Courses */}
          <div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={menu.id} variants={list} initial="hidden" animate="show" exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}>
                <motion.h3 variants={row} className="font-serif text-5xl leading-none text-white sm:text-6xl">
                  {menu.name}
                </motion.h3>
                <motion.p variants={row} className="mt-4 text-ink-mid">
                  {menu.tagline}
                </motion.p>
                <motion.div variants={row} className="mt-5 flex flex-wrap gap-2 text-xs text-ink-light">
                  <span className="flex items-center gap-1.5 rounded-full border border-ink-light/10 px-3 py-1.5">
                    <Users className="h-3.5 w-3.5 text-volt" />
                    Desde {menu.minGuests} invitados
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full border border-ink-light/10 px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-volt" />
                    {menu.serviceTime} de servicio
                  </span>
                </motion.div>

                <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
                  {COURSES.map(({ key, label, icon: Icon }, i) => (
                    <motion.div key={key} variants={row} className="border-t border-ink-light/10 py-5">
                      <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-volt">
                        <span className="font-general text-ink-mid">0{i + 1}</span>
                        <Icon className="h-4 w-4" />
                        {label}
                      </p>
                      <ul className="mt-3 grid gap-1.5">
                        {menu.courses[key].map((dish) => (
                          <li key={dish} className="text-[15px] text-ink-light">
                            {dish}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>

                <motion.div variants={row} className="mt-6">
                  <MagneticButton asChild className="group">
                    <a href="#calculadora">
                      Cotizar este menú
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                  </MagneticButton>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
