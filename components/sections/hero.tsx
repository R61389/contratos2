"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "motion/react";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FLOATING_CARDS = [
  { icon: "🎵", label: "Grupo Musical", sub: "12 disponibles", className: "left-[2%] top-[18%] sm:left-[6%]" },
  { icon: "🎧", label: "DJ", sub: "8 disponibles", className: "right-[2%] top-[10%] sm:right-[6%]" },
  { icon: "🍔", label: "Catering", sub: "20 disponibles", className: "left-[0%] bottom-[22%] sm:left-[3%]" },
  { icon: "🍺", label: "Cervecería Artesanal", sub: "6 disponibles", className: "right-[0%] bottom-[30%] sm:right-[2%]" },
  { icon: "📸", label: "Fotografía", sub: "15 disponibles", className: "left-[16%] bottom-[2%] sm:left-[20%]" },
  { icon: "🎉", label: "Decoración", sub: "18 disponibles", className: "right-[14%] bottom-[4%] sm:right-[18%]" },
];

function FloatingCard({
  icon,
  label,
  sub,
  className,
  delay,
}: (typeof FLOATING_CARDS)[number] & { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("absolute hidden md:block", className)}
    >
      <motion.div
        animate={{ y: [0, -14, 0] }}
        transition={{
          duration: 5 + delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-card"
      >
        <span className="text-2xl leading-none">{icon}</span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-ink-mid">{sub}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const glowX = useTransform(mouseX, (v) => `${v * 100}%`);
  const glowY = useTransform(mouseY, (v) => `${v * 100}%`);
  const background = useMotionTemplate`radial-gradient(600px circle at ${glowX} ${glowY}, rgba(226,232,0,0.10), transparent 70%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  return (
    <section
      id="inicio"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-[100svh] items-center overflow-hidden pt-28"
    >
      {/* background layers */}
      <div className="pointer-events-none absolute inset-0 bg-radial-fade" />
      <div className="pointer-events-none absolute inset-0 bg-grid-glow bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />
      <motion.div
        style={{ background }}
        className="pointer-events-none absolute inset-0"
      />
      <div className="noise pointer-events-none absolute inset-0 opacity-40" />

      {/* ambient particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-volt/60"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.8, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + (i % 5),
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="relative mx-auto w-full max-w-6xl px-6">
        <div className="flex flex-col items-center gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-volt"
          >
            La plataforma #1 de eventos en Cochabamba
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl"
          >
            Todo tu evento
            <br />
            <span className="text-gradient-volt">en un solo lugar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="max-w-2xl text-balance text-base text-ink-mid sm:text-lg md:text-xl"
          >
            Contrata músicos, DJs, catering, bebidas, decoración y mucho más
            desde una sola plataforma.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Button size="lg" className="group">
              Crear mi evento
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="secondary" className="group">
              <PlayCircle className="h-4 w-4" />
              Explorar servicios
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-6 pt-4 text-xs text-ink-mid sm:text-sm"
          >
            <span>+500 eventos organizados</span>
            <span className="h-1 w-1 rounded-full bg-ink-mid/40" />
            <span>+120 proveedores verificados</span>
            <span className="h-1 w-1 rounded-full bg-ink-mid/40" />
            <span>4.9/5 satisfacción</span>
          </motion.div>
        </div>

        <div className="relative mt-20 h-[220px] sm:h-[260px]">
          {FLOATING_CARDS.map((card, i) => (
            <FloatingCard key={card.label} {...card} delay={0.6 + i * 0.12} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-9 w-5 items-start justify-center rounded-full border border-ink-light/20 p-1.5"
        >
          <span className="h-1.5 w-1 rounded-full bg-volt" />
        </motion.div>
      </motion.div>
    </section>
  );
}
