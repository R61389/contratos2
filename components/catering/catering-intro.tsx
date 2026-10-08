"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRight, BadgeCheck, CalendarSearch, MapPin, Plus, UtensilsCrossed } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Stars } from "@/components/provider/stars";
import { CountUp } from "@/components/provider/count-up";

const EASE = [0.16, 1, 0.3, 1] as const;

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
};

function Accent({ children }: { children: string }) {
  return (
    <span className="mx-[0.2em] font-serif text-[1.08em] font-normal italic tracking-normal text-ink-light">{children}</span>
  );
}

export function CateringIntro({ provider }: { provider: Provider }) {
  const details = provider.catering!;
  const city = provider.location.split(",")[0];
  const at = Math.max(0, provider.fullName.indexOf(provider.name));
  const before = provider.fullName.slice(0, at).trim();
  const after = provider.fullName.slice(at + provider.name.length).trim();
  const stats = [
    { value: <CountUp to={provider.eventsCount} suffix="+" />, label: "Eventos realizados" },
    { value: <CountUp to={details.guestsServed} suffix="+" duration={2.2} />, label: "Invitados atendidos" },
    { value: <CountUp to={provider.yearsActive} />, label: "Años de experiencia" },
    { value: <CountUp to={details.satisfaction} suffix="%" />, label: "Clientes satisfechos" },
  ];

  return (
    <section className="relative pb-20 pt-[12svh] sm:pt-[14svh]">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-6xl px-6"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-xs font-semibold text-volt">
              <BadgeCheck className="h-3.5 w-3.5" />
              Proveedor verificado
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-light/15 px-3 py-1 text-xs font-medium text-ink-light">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              {provider.kicker}
            </span>
          </motion.div>

          <motion.h2
            variants={item}
            className="mt-7 max-w-4xl text-balance font-general text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-7xl"
          >
            {before && <Accent>{before}</Accent>}
            {provider.name}
            {after && <Accent>{after}</Accent>}
          </motion.h2>

          <motion.p variants={item} className="mt-6 max-w-2xl text-balance text-base text-ink-mid sm:text-lg">
            {provider.tagline}
          </motion.p>

          <motion.div
            variants={item}
            className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <Stars rating={provider.rating} className="text-base" />
              <span className="font-semibold text-white">{provider.rating.toFixed(1)}</span>
              <span className="text-ink-mid">({provider.reviewsCount} reseñas)</span>
            </span>
            <span className="hidden h-4 w-px bg-ink-light/15 sm:block" />
            <span className="text-ink-light">Más de {provider.eventsCount} eventos realizados</span>
            <span className="hidden h-4 w-px bg-ink-light/15 sm:block" />
            <span className="flex items-center gap-1.5 text-ink-light">
              <MapPin className="h-4 w-4 text-volt" />
              {city}
            </span>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <MagneticButton size="lg" asChild className="group w-full sm:w-auto" wrapperClassName="block sm:inline-block">
              <a href="#calculadora">
                Solicitar cotización
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </MagneticButton>
            <MagneticButton size="lg" variant="secondary" asChild className="w-full sm:w-auto" wrapperClassName="block sm:inline-block">
              <a href="#disponibilidad">
                <CalendarSearch className="h-4 w-4" />
                Consultar disponibilidad
              </a>
            </MagneticButton>
          </motion.div>
          <motion.div variants={item} className="mt-4">
            <Link
              href={`/organizar?agregar=${provider.slug}`}
              className="group inline-flex items-center gap-1.5 text-sm text-ink-light transition-colors hover:text-volt"
            >
              <Plus className="h-4 w-4" />
              Agregar a mi evento con otros proveedores
            </Link>
          </motion.div>
        </div>

        {/* KPIs — editorial, like the numbers on a guide's cover */}
        <motion.div
          variants={item}
          className="mt-20 grid grid-cols-2 border-y border-ink-light/10 lg:grid-cols-4"
        >
          {stats.map(({ value, label }, i) => (
            <div
              key={label}
              className={
                "group relative flex flex-col items-center px-4 py-10 text-center sm:py-12 " +
                (i % 2 === 1 ? "border-l border-ink-light/10 " : "") +
                (i >= 2 ? "border-t border-ink-light/10 lg:border-t-0 " : "") +
                (i === 2 ? "lg:border-l" : "")
              }
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(226,232,0,0.10),transparent_65%)] opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
              <p className="font-general text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
                {value}
              </p>
              <p className="mt-3 font-serif text-lg italic text-ink-mid sm:text-xl">{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="mt-14 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <p className="text-balance text-base leading-relaxed text-ink-light/90 sm:text-lg">{provider.bio}</p>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {provider.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-ink-light/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-ink-light">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
