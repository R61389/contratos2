"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { ArrowRight, Compass, ChevronDown } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/utils";

const TITLE = "VIBRA";

const FLOATING_CARDS = [
  { icon: "🎵", label: "Grupo Musical", className: "left-[2%] top-[10%] sm:left-[6%]", depth: 18 },
  { icon: "🎧", label: "DJ", className: "right-[3%] top-[16%] sm:right-[8%]", depth: 28 },
  { icon: "🍔", label: "Catering", className: "left-[0%] top-[62%] sm:left-[4%]", depth: 14 },
  { icon: "🍺", label: "Bebidas", className: "right-[1%] top-[58%] sm:right-[5%]", depth: 24 },
  { icon: "📸", label: "Fotografía", className: "left-[14%] top-[82%] sm:left-[18%]", depth: 10 },
  { icon: "🎉", label: "Decoración", className: "right-[13%] top-[80%] sm:right-[17%]", depth: 20 },
];

const titleContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.5 },
  },
};

const letterVariant: Variants = {
  hidden: { opacity: 0, y: 70, filter: "blur(18px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const wordVariant: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 1.3 } },
};

const wordItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

function FloatingCard({
  icon,
  label,
  className,
  depth,
  mouseX,
  mouseY,
  delay,
}: (typeof FLOATING_CARDS)[number] & {
  mouseX: ReturnType<typeof useSpring>;
  mouseY: ReturnType<typeof useSpring>;
  delay: number;
}) {
  const px = useTransform(mouseX, [-0.5, 0.5], [depth, -depth]);
  const py = useTransform(mouseY, [-0.5, 0.5], [depth, -depth]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ x: px, y: py }}
      className={cn("pointer-events-none absolute hidden md:block", className)}
    >
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{
          duration: 6 + depth * 0.1,
          repeat: Infinity,
          ease: "easeInOut",
          delay: delay * 0.4,
        }}
        className="glass flex items-center gap-2.5 rounded-2xl px-4 py-2.5 shadow-card"
      >
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-xs font-medium text-ink-light sm:text-sm">{label}</span>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 60, damping: 20, mass: 0.6 });
  const mouseY = useSpring(rawY, { stiffness: 60, damping: 20, mass: 0.6 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const glowX = useTransform(mouseX, (v) => `${50 + v * 40}%`);
  const glowY = useTransform(mouseY, (v) => `${50 + v * 40}%`);
  const spotlight = useMotionTemplate`radial-gradient(720px circle at ${glowX} ${glowY}, rgba(226,232,0,0.12), transparent 70%)`;

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <section
      id="inicio"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative flex h-[100svh] min-h-[720px] items-center justify-center overflow-hidden bg-ink"
    >
      {/* base radial gradient + depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_18%,#1d1d1d_0%,#141414_55%,#0c0c0c_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-glow bg-[size:64px_64px] opacity-60 [mask-image:radial-gradient(ellipse_55%_45%_at_50%_35%,black,transparent)]" />

      {/* ambient volt lights */}
      <motion.div
        aria-hidden
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[12%] top-[15%] h-[280px] w-[280px] rounded-full bg-volt/20 blur-[110px]"
      />
      <motion.div
        aria-hidden
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
        className="pointer-events-none absolute right-[10%] bottom-[18%] h-[320px] w-[320px] rounded-full bg-volt/15 blur-[130px]"
      />

      {/* mouse spotlight for depth */}
      <motion.div style={{ background: spotlight }} className="pointer-events-none absolute inset-0" />

      <div className="noise pointer-events-none absolute inset-0 opacity-30" />

      {/* floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-[3px] w-[3px] rounded-full bg-volt/70"
            style={{
              left: `${(i * 41.3) % 100}%`,
              top: `${(i * 27.7) % 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.9, 0.1],
              scale: [0.4, 1.3, 0.4],
              y: [0, -18, 0],
            }}
            transition={{
              duration: 4.5 + (i % 6),
              repeat: Infinity,
              delay: i * 0.22,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* decorative floating service cards */}
      {FLOATING_CARDS.map((card, i) => (
        <FloatingCard
          key={card.label}
          {...card}
          mouseX={mouseX}
          mouseY={mouseY}
          delay={1.9 + i * 0.1}
        />
      ))}

      <motion.div
        style={{ y: scrollY, opacity: scrollOpacity }}
        className="relative z-10 flex w-full max-w-5xl flex-col items-center px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-volt"
        >
          Bienvenido a la nueva forma de celebrar
        </motion.div>

        <motion.h1
          variants={titleContainer}
          initial="hidden"
          animate="show"
          onAnimationComplete={() => setEntered(true)}
          className={cn(
            "select-none text-[clamp(4.5rem,17vw,14rem)] font-black leading-[0.85] tracking-tight text-white glow-text-volt"
          )}
          style={{ fontWeight: 900 }}
        >
          <motion.span
            animate={entered ? { y: [0, -12, 0] } : {}}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block"
          >
            {TITLE.split("").map((char, i) => (
              <motion.span key={i} variants={letterVariant} className="inline-block">
                {char}
              </motion.span>
            ))}
          </motion.span>
        </motion.h1>

        <motion.p
          variants={wordVariant}
          initial="hidden"
          animate="show"
          className="mt-8 max-w-xl text-balance text-base text-ink-light/90 sm:text-lg md:text-xl"
        >
          {"Encuentra la mejor vibra para tu celebración.".split(" ").map((word, i) => (
            <motion.span key={i} variants={wordItem} className="inline-block">
              {word}
              {" "}
            </motion.span>
          ))}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 2 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <MagneticButton size="lg" variant="secondary" className="group">
            <Compass className="h-4 w-4" />
            Explorar eventos
          </MagneticButton>
          <MagneticButton size="lg" variant="primary" className="group">
            Organizar mi evento
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-mid">
          Desliza para descubrir
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-volt" />
        </motion.div>
      </motion.div>
    </section>
  );
}
