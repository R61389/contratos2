"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import {
  Music4,
  Disc3,
  UtensilsCrossed,
  Beer,
  Camera,
  PartyPopper,
  Speaker,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SERVICES = [
  { icon: Music4, title: "Grupos Musicales", desc: "Bandas en vivo para toda ocasión" },
  { icon: Disc3, title: "DJs", desc: "Sets a medida para tu pista de baile" },
  { icon: UtensilsCrossed, title: "Catering", desc: "Menús gourmet para cualquier evento" },
  { icon: Beer, title: "Bebidas", desc: "Cervecerías artesanales y barra libre" },
  { icon: Camera, title: "Fotografía", desc: "Captura cada momento inolvidable" },
  { icon: PartyPopper, title: "Decoración", desc: "Ambientación temática y floral" },
  { icon: Speaker, title: "Sonido", desc: "Equipos profesionales de audio" },
  { icon: Lightbulb, title: "Iluminación", desc: "Luces y efectos para tu fiesta" },
];

function ServiceCard({
  icon: Icon,
  title,
  desc,
  index,
}: (typeof SERVICES)[number] & { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(200px circle at ${mx}% ${my}%, rgba(226,232,0,0.16), transparent 70%)`;

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 14);
    rx.set((0.5 - py) * 14);
    mx.set(px * 100);
    my.set(py * 100);
  }

  function handleLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ rotateX: rx, rotateY: ry }}
        className="glass group relative overflow-hidden rounded-2xl p-6 shadow-card transition-shadow duration-300 hover:shadow-glow"
      >
        <motion.div
          style={{ background: glow }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative flex flex-col gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-volt transition-colors duration-300 group-hover:bg-volt/15">
            <Icon className="h-6 w-6" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-ink-mid">{desc}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Services() {
  return (
    <section id="servicios" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 flex flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-volt/30 bg-volt/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-volt">
            Servicios
          </span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
            Cada pieza de tu evento, en un solo panel
          </h2>
          <p className="max-w-2xl text-balance text-base text-ink-mid sm:text-lg">
            Explora nuestras categorías y encuentra proveedores verificados
            para cada detalle de tu celebración.
          </p>
        </div>

        <div className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4")}>
          {SERVICES.map((service, i) => (
            <ServiceCard key={service.title} {...service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
