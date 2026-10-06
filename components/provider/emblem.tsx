"use client";

import { useId } from "react";
import { motion } from "motion/react";
import type { EmblemVariant } from "@/lib/providers";
import { cn } from "@/lib/utils";

function Glyph({ variant, glow }: { variant: EmblemVariant; glow: string }) {
  const stroke = {
    fill: "none",
    stroke: "#E2E800",
    strokeWidth: 6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    filter: `url(#${glow})`,
  };

  switch (variant) {
    case "eclipse":
      return (
        <g>
          <circle cx="200" cy="200" r="150" fill="none" stroke="#E2E800" strokeWidth="10" opacity="0.9" filter={`url(#${glow})`} />
          <circle cx="212" cy="190" r="146" fill="#0b0b0b" />
          <circle cx="94" cy="96" r="9" fill="#ffffff" filter={`url(#${glow})`} />
          <path d="M94 60 V132 M58 96 H130" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case "waves":
      return (
        <g {...stroke}>
          <path d="M80 170 Q120 130 160 170 T240 170 T320 170" />
          <path d="M80 210 Q120 170 160 210 T240 210 T320 210" opacity="0.75" />
          <path d="M80 250 Q120 210 160 250 T240 250 T320 250" opacity="0.5" />
        </g>
      );
    case "vinyl":
      return (
        <g>
          {[132, 116, 100, 84].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" />
          ))}
          <circle cx="200" cy="200" r="46" fill="#E2E800" filter={`url(#${glow})`} />
          <circle cx="200" cy="200" r="6" fill="#141414" />
          <path d="M318 92 L262 168 L236 178" {...stroke} strokeWidth={5} />
        </g>
      );
    case "pulse":
      return <path d="M70 200 H140 L160 150 L185 260 L210 120 L235 230 L255 200 H330" {...stroke} />;
    case "cloche":
      return (
        <g {...stroke}>
          <path d="M110 240 A90 90 0 0 1 290 240" />
          <path d="M90 250 H310" />
          <circle cx="200" cy="138" r="10" />
          <path d="M150 210 A50 50 0 0 1 185 175" opacity="0.6" />
        </g>
      );
    case "crown":
      return (
        <g {...stroke}>
          <path d="M110 250 L120 150 L165 200 L200 130 L235 200 L280 150 L290 250 Z" />
          <path d="M115 280 H285" />
        </g>
      );
    case "peaks":
      return (
        <g {...stroke}>
          <path d="M80 270 L160 150 L205 215 L245 165 L320 270 Z" />
          <path d="M140 180 L160 150 L180 180" opacity="0.7" />
          <circle cx="270" cy="120" r="16" />
        </g>
      );
    case "hop":
      return (
        <g {...stroke}>
          <path d="M200 110 C250 150 250 250 200 300 C150 250 150 150 200 110 Z" />
          <path d="M165 165 Q200 185 235 165 M158 205 Q200 228 242 205 M165 245 Q200 265 235 245" opacity="0.7" />
          <path d="M200 110 C205 92 220 82 238 80" />
        </g>
      );
  }
}

export function Emblem({
  variant,
  className,
  animated = true,
}: {
  variant: EmblemVariant;
  className?: string;
  animated?: boolean;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const glow = `glow-${uid}`;
  const ring = `ring-${uid}`;

  return (
    <svg viewBox="0 0 400 400" className={cn("overflow-visible", className)} aria-hidden>
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={ring} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2E800" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E2E800" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <motion.g
        animate={animated ? { rotate: 360 } : undefined}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="200" cy="200" r="194" fill="none" stroke="#D6D6D6" strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="2 10" />
        <circle cx="200" cy="6" r="4" fill="#E2E800" />
      </motion.g>

      {variant !== "eclipse" && (
        <>
          <circle cx="200" cy="200" r="172" fill="#0b0b0b" fillOpacity="0.55" />
          <circle cx="200" cy="200" r="172" fill="none" stroke={`url(#${ring})`} strokeWidth="4" filter={`url(#${glow})`} />
        </>
      )}

      <Glyph variant={variant} glow={glow} />
    </svg>
  );
}
