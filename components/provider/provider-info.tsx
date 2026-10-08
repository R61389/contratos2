"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { Award, BadgeCheck, CalendarSearch, MapPin, PartyPopper, Plus, Star, Zap, ArrowRight } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Emblem } from "@/components/provider/emblem";
import { Stars } from "@/components/provider/stars";
import { CountUp } from "@/components/provider/count-up";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function ProviderInfo({ provider }: { provider: Provider }) {
  const stats = [
    { icon: Star, label: "Calificación", value: <CountUp to={provider.rating} decimals={1} /> },
    { icon: PartyPopper, label: "Eventos realizados", value: <CountUp to={provider.eventsCount} prefix="+" /> },
    { icon: Award, label: "Años de trayectoria", value: <CountUp to={provider.yearsActive} /> },
    { icon: Zap, label: "Tiempo de respuesta", value: <span className="text-2xl sm:text-3xl">{provider.responseTime}</span> },
  ];

  return (
    <section className="relative pb-24 pt-[12svh] sm:pt-[15svh]">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mx-auto max-w-6xl px-6"
      >
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <motion.div variants={item} className="flex flex-wrap items-center gap-3">
              <span className="glass relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full">
                {provider.logo ? (
                  <Image src={provider.logo.src} alt="" width={provider.logo.width} height={provider.logo.height} sizes="56px" className="h-10 w-auto" />
                ) : (
                  <Emblem variant={provider.emblem} animated={false} className="h-11 w-11" />
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-3 py-1 text-xs font-semibold text-volt">
                <BadgeCheck className="h-3.5 w-3.5" />
                Proveedor verificado
              </span>
              <span className="rounded-full border border-ink-light/15 px-3 py-1 text-xs font-medium text-ink-light">
                {provider.category}
              </span>
            </motion.div>

            <motion.h2
              variants={item}
              className="mt-6 text-balance font-general text-4xl font-semibold tracking-tight text-white sm:text-6xl"
            >
              {provider.fullName}
            </motion.h2>

            <motion.p variants={item} className="mt-4 text-balance text-base text-ink-mid sm:text-lg">
              {provider.tagline}
            </motion.p>

            <motion.div variants={item} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
              <span className="flex items-center gap-2">
                <Stars rating={provider.rating} className="text-base" />
                <span className="font-semibold text-white">{provider.rating.toFixed(1)}</span>
                <span className="text-ink-mid">({provider.reviewsCount} reseñas)</span>
              </span>
              <span className="flex items-center gap-2 text-ink-light">
                <PartyPopper className="h-4 w-4 text-volt" />
                Más de {provider.eventsCount} eventos realizados
              </span>
              <span className="flex items-center gap-2 text-ink-light">
                <MapPin className="h-4 w-4 text-volt" />
                {provider.location}
              </span>
            </motion.div>
          </div>

          <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:shrink-0 lg:flex-col">
            <MagneticButton size="lg" asChild className="group lg:w-full" wrapperClassName="lg:block">
              <a href="#paquetes">
                Reservar ahora
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </MagneticButton>
            <MagneticButton size="lg" variant="secondary" asChild className="lg:w-full" wrapperClassName="lg:block">
              <a href="#disponibilidad">
                <CalendarSearch className="h-4 w-4" />
                Consultar disponibilidad
              </a>
            </MagneticButton>
            <MagneticButton size="lg" variant="outline" asChild className="lg:w-full" wrapperClassName="lg:block">
              <Link href={`/organizar?agregar=${provider.slug}`}>
                <Plus className="h-4 w-4" />
                Agregar a mi evento
              </Link>
            </MagneticButton>
          </motion.div>
        </div>

        <motion.div variants={item} className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass group relative overflow-hidden rounded-2xl p-5 transition-colors duration-300 hover:border-volt/30">
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-volt/0 blur-2xl transition-colors duration-500 group-hover:bg-volt/20" />
              <Icon className="h-5 w-5 text-volt" />
              <p className="mt-4 font-general text-3xl font-semibold text-white sm:text-4xl">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-ink-mid">{label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={item} className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
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
