"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

function format(v: number, decimals: number, prefix: string, suffix: string) {
  return `${prefix}${v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}${suffix}`;
}

export function CountUp({
  to,
  decimals = 0,
  duration = 1.6,
  prefix = "",
  suffix = "",
}: {
  to: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = format(v, decimals, prefix, suffix);
      },
    });
    return () => controls.stop();
  }, [inView, to, decimals, duration, prefix, suffix, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(to, decimals, prefix, suffix)}
    </span>
  );
}
