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

/**
 * One line of the giant background type. The "back" copy draws every letter; the "front" copy keeps the
 * same layout but only shows the odd letters, so those appear in front of the chef while the rest stay behind.
 */
function GiantWord({
  word,
  layer,
  fontSize,
  delay,
  tone,
}: {
  word: string;
  layer: "back" | "front";
  fontSize: string;
  delay: number;
  tone: "solid" | "soft";
}) {
  const letters = Array.from(word);
  return (
    <div
      aria-hidden
      className={cn(
        "whitespace-nowrap font-general font-bold uppercase leading-[0.8] tracking-[-0.05em]",
        tone === "soft" ? "text-white/[0.14]" : "text-white"
      )}
      style={{ fontSize }}
    >
      <span className="inline-flex overflow-hidden pb-[0.06em]">
        {letters.map((char, i) => (
          <motion.span
            key={i}
            className={cn(
              "inline-block",
              layer === "front" && i % 2 === 0 && "opacity-0",
              layer === "front" && "[filter:drop-shadow(0_18px_30px_rgba(0,0,0,0.55))]"
            )}
            initial={{ y: "105%" }}
            animate={{ y: "0%" }}
            transition={{ duration: 1.2, delay: delay + i * 0.05, ease: EASE }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    </div>
  );
}

export function CateringHero({ provider }: { provider: Provider }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [top, bottom] = provider.catering!.heroWords;

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mouseX = useSpring(rawX, { stiffness: 50, damping: 18, mass: 0.7 });
  const mouseY = useSpring(rawY, { stiffness: 50, damping: 18, mass: 0.7 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bg = useLayer(mouseX, mouseY, scrollYProgress, 12, 170);
  const backWord = useLayer(mouseX, mouseY, scrollYProgress, 22, 40);
  const logo = useLayer(mouseX, mouseY, scrollYProgress, 30, 70);
  const subject = useLayer(mouseX, mouseY, scrollYProgress, 52, -90);
  const frontWord = useLayer(mouseX, mouseY, scrollYProgress, 64, -150);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  const { subject: s } = provider;
  const subjectHeight = `min(${s.heightPct}svh, ${(150 / (s.width / s.height)).toFixed(2)}vw)`;
  const topSize = `min(${(118 / top.length).toFixed(2)}vw, 15rem)`;
  const bottomSize = `min(${(112 / bottom.length).toFixed(2)}vw, 14rem)`;

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="relative z-10 h-[100svh] min-h-[680px] w-full overflow-x-clip"
    >
      <div className="absolute inset-0 overflow-hidden rounded-b-[2.5rem] border-b border-white/10 bg-ink sm:rounded-b-[3.5rem]">
        {/* Layer 1 — cinematic food photography: slow push-in, soft blur, dark overlay */}
        <motion.div style={bg} className="absolute -inset-[6%]">
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1.06, opacity: 1 }}
            transition={{ duration: 2.4, ease: EASE }}
            className="absolute inset-0"
          >
            <motion.div
              animate={reduce ? undefined : { scale: [1, 1.08, 1], x: ["0%", "-1.5%", "0%"] }}
              transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image src={provider.heroImage} alt="" fill priority sizes="100vw" className="object-cover" />
            </motion.div>
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 backdrop-blur-[6px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/55 to-ink/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_20%,rgba(10,10,10,0.85)_100%)]" />

        {/* Warm light behind the pass, and rising steam */}
        <motion.div
          aria-hidden
          animate={{ opacity: [0.35, 0.6, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-[30%] h-[55vmin] w-[80vmin] -translate-x-1/2 rounded-full bg-volt/15 blur-[130px]"
        />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3">
          {Array.from({ length: 7 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute bottom-[20%] h-40 w-16 rounded-full bg-white/[0.07] blur-2xl"
              style={{ left: `${22 + i * 9}%` }}
              animate={reduce ? undefined : { y: [0, -260], opacity: [0, 0.9, 0], scaleX: [1, 1.8, 2.4] }}
              transition={{ duration: 7 + (i % 3), repeat: Infinity, delay: i * 1.1, ease: "easeOut" }}
            />
          ))}
        </div>
        <div className="noise absolute inset-0 opacity-40" />

        {/* Layer 4 (back) — the giant type, behind the logo and the chef */}
        <motion.div
          style={{ ...backWord, opacity: fade }}
          className="absolute inset-x-0 top-[12%] flex justify-center sm:top-[9%]"
        >
          <GiantWord word={top} layer="back" fontSize={topSize} delay={0.3} tone="soft" />
        </motion.div>
        <motion.div
          style={{ ...frontWord, opacity: fade }}
          className="absolute inset-x-0 top-[60%] flex justify-center sm:top-[57%]"
        >
          <GiantWord word={bottom} layer="back" fontSize={bottomSize} delay={0.55} tone="solid" />
        </motion.div>

        {/* Layer 2 — the logo on a glass plate, centred */}
        <div className="absolute inset-x-0 top-[18%] flex justify-center sm:top-[13%]">
          <motion.div style={logo}>
            <motion.div
              initial={{ opacity: 0, scale: 0.82, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 1.6, delay: 0.2, ease: EASE }}
            >
              <motion.div
                animate={reduce ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] px-8 py-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl sm:rounded-[2.75rem] sm:px-14 sm:py-10"
              >
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
                <motion.div
                  aria-hidden
                  style={{ skewX: -14 }}
                  initial={{ x: "-150%" }}
                  animate={{ x: "350%" }}
                  transition={{ duration: 2.4, delay: 1.6, repeat: Infinity, repeatDelay: 6, ease: "easeInOut" }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                />
                {provider.logo ? (
                  <Image
                    src={provider.logo.src}
                    alt={provider.logo.alt}
                    width={provider.logo.width}
                    height={provider.logo.height}
                    priority
                    sizes="(max-width: 768px) 60vw, 380px"
                    className="relative h-[min(24svh,34vw)] w-auto [filter:drop-shadow(0_10px_30px_rgba(0,0,0,0.5))]"
                  />
                ) : (
                  <Emblem variant={provider.emblem} className="relative h-[min(24svh,34vw)] w-[min(24svh,34vw)]" />
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Layer 3 — the chef, in front of the logo, breaking out of the frame */}
      <motion.div style={subject} className="pointer-events-none absolute inset-x-0 -bottom-[6svh] flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 120, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.6, ease: EASE }}
          className="relative"
        >
          <div aria-hidden className="absolute inset-x-[15%] bottom-[10%] top-[20%] rounded-full bg-volt/10 blur-[100px]" />
          <div className="relative [filter:drop-shadow(0_30px_60px_rgba(0,0,0,0.7))]">
            <Image
              src={s.src}
              alt={s.alt}
              width={s.width}
              height={s.height}
              priority
              sizes="(max-width: 768px) 130vw, 1100px"
              className="w-auto max-w-none object-contain object-bottom [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"
              style={{ height: subjectHeight }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Layer 4 (front) — the alternate letters of the lower word, drawn over the chef */}
      <motion.div
        style={{ ...frontWord, opacity: fade }}
        className="pointer-events-none absolute inset-x-0 top-[60%] flex justify-center sm:top-[57%]"
      >
        <GiantWord word={bottom} layer="front" fontSize={bottomSize} delay={0.55} tone="solid" />
      </motion.div>

      <h1 className="sr-only">{provider.fullName}</h1>
    </section>
  );
}
