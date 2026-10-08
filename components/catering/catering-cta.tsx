"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowRight, CalendarCheck } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { Emblem } from "@/components/provider/emblem";

const FLOATERS = [
  { className: "left-[4%] top-[12%] h-24 w-24 sm:h-36 sm:w-36", depth: -120, delay: 0 },
  { className: "right-[6%] top-[8%] h-20 w-20 sm:h-28 sm:w-28", depth: -60, delay: 1.2 },
  { className: "bottom-[10%] right-[10%] h-28 w-28 sm:h-40 sm:w-40", depth: -160, delay: 0.6 },
];

export function CateringCta({ provider }: { provider: Provider }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const ys = [
    useTransform(scrollYProgress, [0, 1], [0, FLOATERS[0].depth]),
    useTransform(scrollYProgress, [0, 1], [0, FLOATERS[1].depth]),
    useTransform(scrollYProgress, [0, 1], [0, FLOATERS[2].depth]),
  ];
  const dishes = provider.catering!.menus.slice(0, FLOATERS.length);

  return (
    <section className="relative px-4 py-24 sm:px-6 sm:py-32">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/10"
      >
        <motion.div style={{ y: bgY }} className="absolute -inset-[10%]">
          <Image src={provider.gallery[0]?.src ?? provider.heroImage} alt="" fill sizes="100vw" className="object-cover blur-[3px]" />
        </motion.div>
        <div className="absolute inset-0 bg-ink/80" />
        <motion.div
          aria-hidden
          style={{ x: "-50%", y: "-50%" }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[480px] w-[480px] rounded-full bg-volt/20 blur-[120px]"
        />
        {dishes.map((d, i) => (
          <motion.div key={d.id} aria-hidden style={{ y: ys[i] }} className={`absolute hidden md:block ${FLOATERS[i].className}`}>
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, 4, 0] }}
              transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: FLOATERS[i].delay }}
              className="relative h-full w-full overflow-hidden rounded-full shadow-card ring-1 ring-white/20"
            >
              <Image src={d.image} alt="" fill sizes="160px" className="object-cover" />
            </motion.div>
          </motion.div>
        ))}
        <div className="noise absolute inset-0 opacity-40" />

        <div className="relative flex flex-col items-center px-6 py-20 text-center sm:px-12 sm:py-28">
          {provider.logo ? (
            <Image src={provider.logo.src} alt="" width={provider.logo.width} height={provider.logo.height} sizes="160px" className="h-20 w-auto opacity-90 sm:h-24" />
          ) : (
            <Emblem variant={provider.emblem} animated={false} className="h-20 w-20" />
          )}
          <h2 className="mt-8 max-w-3xl text-balance font-serif text-5xl leading-[1.02] text-white sm:text-7xl">
            Haz que tus invitados <span className="italic text-volt">recuerden cada sabor.</span>
          </h2>
          <p className="mt-6 max-w-xl text-balance text-ink-light/80">
            Cuéntanos tu fecha y número de invitados. Respondemos en {provider.responseTime} con una propuesta a tu medida.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <MagneticButton size="lg" asChild className="group">
              <a href="#calculadora">
                Solicitar cotización
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </MagneticButton>
            <MagneticButton size="lg" variant="secondary" asChild>
              <a href="#disponibilidad">
                <CalendarCheck className="h-4 w-4" />
                Reservar fecha
              </a>
            </MagneticButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
