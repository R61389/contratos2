"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { Provider } from "@/lib/providers";
import { Emblem } from "@/components/provider/emblem";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

function useLayer(
  mouseX: MotionValue<number>,
  mouseY: MotionValue<number>,
  scroll: MotionValue<number>,
  depth: number,
  scrollShift: number
) {
  const x = useTransform(mouseX, (v) => v * -depth);
  const y = useTransform([mouseY, scroll], ([m, s]: number[]) => m * -depth + s * scrollShift);
  return { x, y };
}

function HeroWord({
  provider,
  variant,
  fontSize,
}: {
  provider: Provider;
  variant: "solid" | "outline";
  fontSize: string;
}) {
  const letters = Array.from(provider.heroWord);
  const Heading = variant === "solid" ? "h1" : "div";
  return (
    <div className="flex flex-col items-center">
      <motion.span
        initial={{ opacity: 0, y: 16, letterSpacing: "0.9em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "0.5em" }}
        transition={{ duration: 1.2, delay: 0.5, ease: EASE }}
        className={cn(
          "mb-1 pl-[0.5em] font-general text-[11px] font-semibold uppercase text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.9)] sm:mb-3 sm:text-sm",
          variant === "solid" && "invisible"
        )}
      >
        {provider.kicker}
      </motion.span>
      <Heading
        className={cn(
          "whitespace-nowrap font-black uppercase leading-[0.82] tracking-[-0.045em]",
          variant === "solid"
            ? "text-white/90 [filter:drop-shadow(0_0_28px_rgba(226,232,0,0.28))]"
            : "text-outline"
        )}
        style={{ fontSize }}
      >
        {variant === "solid" && <span className="sr-only">{provider.fullName}</span>}
        <span aria-hidden className="inline-flex overflow-hidden pb-[0.06em]">
          {letters.map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.1, delay: 0.35 + i * 0.06, ease: EASE }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      </Heading>
    </div>
  );
}

export function ProviderHero({ provider }: { provider: Provider }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 50, damping: 18, mass: 0.7 });
  const mouseY = useSpring(rawY, { stiffness: 50, damping: 18, mass: 0.7 });

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bg = useLayer(mouseX, mouseY, scrollYProgress, 14, 160);
  const emblem = useLayer(mouseX, mouseY, scrollYProgress, 26, 90);
  const word = useLayer(mouseX, mouseY, scrollYProgress, 38, -40);
  const subject = useLayer(mouseX, mouseY, scrollYProgress, 60, -110);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  const { subject: s } = provider;
  const aspect = s.width / s.height;
  // Only binds on narrow screens, where a wider crop keeps the subject large enough for the text to cross it.
  const maxWidthVw = s.anchor === "right" ? 140 : 230;
  const subjectHeight = `min(${s.heightPct}svh, ${(maxWidthVw / aspect).toFixed(2)}vw)`;
  const wordSize = `min(${Math.min(21, 128 / provider.heroWord.length).toFixed(2)}vw, 17rem)`;

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative z-10 h-[100svh] min-h-[640px] w-full overflow-x-clip"
    >
      {/* Frame: layers 1, 2 and the solid half of layer 4 are clipped to it */}
      <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] border-b border-white/10 bg-ink sm:rounded-b-[3.5rem]">
        {/* Layer 1 — photo, partial blur, overlay, ambient light, particles */}
        <motion.div style={bg} className="absolute -inset-[6%]">
          <motion.div
            initial={{ scale: 1.18, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 1 }}
            transition={{ duration: 2.2, ease: EASE }}
            className="absolute inset-0"
          >
            <Image
              src={provider.heroImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 backdrop-blur-md [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_35%,black_85%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,10,10,0.75)_100%)]" />

        <motion.div
          aria-hidden
          style={{ x: "-50%", y: "-50%" }}
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-[38%] h-[60vmin] w-[60vmin] rounded-full bg-volt/25 blur-[120px]"
        />
        <motion.div
          aria-hidden
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute -left-[10%] bottom-[10%] h-[45vmin] w-[45vmin] rounded-full bg-white/10 blur-[110px]"
        />

        <div aria-hidden className="pointer-events-none absolute inset-0">
          {Array.from({ length: 22 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-[3px] w-[3px] rounded-full bg-volt/70"
              style={{ left: `${(i * 43.7) % 100}%`, top: `${(i * 29.3) % 100}%` }}
              animate={{ opacity: [0, 0.9, 0], y: [0, -28, -56] }}
              transition={{ duration: 6 + (i % 5), repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
            />
          ))}
        </div>

        <div className="noise absolute inset-0 opacity-40" />

        {/* Layer 2 — emblem, exact centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div style={emblem}>
            <motion.div
              initial={{ opacity: 0, scale: 0.6, filter: "blur(24px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.6, delay: 0.15, ease: EASE }}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -14, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <Emblem variant={provider.emblem} className="h-[min(78svh,96vw)] w-[min(78svh,96vw)] opacity-90" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Layer 4 (back) — solid word, sits behind the subject */}
        <motion.div style={{ ...word, opacity: fade }} className="absolute inset-x-0 top-[62%] flex justify-center sm:top-[55%]">
          <HeroWord provider={provider} variant="solid" fontSize={wordSize} />
        </motion.div>
      </div>

      {/* Layer 3 — cut-out subject, allowed to break out of the frame's bottom edge */}
      <motion.div
        style={subject}
        className={cn(
          "pointer-events-none absolute -bottom-[7svh] flex",
          s.anchor === "right" ? "-right-[6vw] justify-end" : "inset-x-0 justify-center"
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 120, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.55, ease: EASE }}
          className="relative"
        >
          <div
            aria-hidden
            className="absolute inset-x-[20%] bottom-[15%] top-[25%] rounded-full bg-volt/10 blur-[100px]"
          />
          <Image
            src={s.src}
            alt={s.alt}
            width={s.width}
            height={s.height}
            priority
            sizes="(max-width: 768px) 150vw, 100vw"
            className="relative w-auto max-w-none object-contain object-bottom drop-shadow-[0_30px_60px_rgba(0,0,0,0.65)] [mask-image:linear-gradient(to_bottom,black_82%,transparent_100%)]"
            style={{ height: subjectHeight }}
          />
        </motion.div>
      </motion.div>

      {/* Layer 4 (front) — outlined copy at the same position, drawn over the subject */}
      <motion.div
        aria-hidden
        style={{ ...word, opacity: fade }}
        className="pointer-events-none absolute inset-x-0 top-[62%] flex justify-center sm:top-[55%]"
      >
        <HeroWord provider={provider} variant="outline" fontSize={wordSize} />
      </motion.div>
    </section>
  );
}
