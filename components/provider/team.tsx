"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";
import type { Provider, TeamMember } from "@/lib/providers";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 150, damping: 15 });
  const ry = useSpring(0, { stiffness: 150, damping: 15 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glare = useMotionTemplate`radial-gradient(260px circle at ${gx}% ${gy}%, rgba(255,255,255,0.18), transparent 60%)`;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * 18);
    rx.set((0.5 - py) * 18);
    gx.set(px * 100);
    gy.set(py * 100);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry }}
        className="glass group relative overflow-hidden rounded-3xl shadow-card transition-shadow duration-500 hover:shadow-glow"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          {member.cutout ? (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(226,232,0,0.35),transparent_60%)] transition-opacity duration-500 group-hover:opacity-100 sm:opacity-70" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
              <span
                aria-hidden
                className="absolute inset-x-0 top-6 select-none text-center font-black uppercase leading-none tracking-tighter text-white/[0.06] transition-colors duration-500 group-hover:text-volt/15"
                style={{ fontSize: "5.5rem" }}
              >
                {member.role.split(" ")[0]}
              </span>
              <div className="absolute inset-x-0 bottom-0 top-10">
                <Image
                  src={member.photo}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 25vw"
                  className="object-contain object-bottom transition-transform duration-700 ease-out group-hover:-translate-y-3 group-hover:scale-[1.06]"
                />
              </div>
            </>
          ) : (
            <>
              <Image
                src={member.photo}
                alt={member.name}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.07]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
            </>
          )}
          <motion.div style={{ background: glare }} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          {member.years !== undefined && (
            <span className="mb-3 inline-flex items-center rounded-full bg-volt px-2.5 py-0.5 text-[11px] font-bold text-ink">
              {member.years} años de experiencia
            </span>
          )}
          <h3 className="font-general text-xl font-semibold text-white">{member.name}</h3>
          <p className="text-sm text-ink-light/80">{member.role}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Team({
  provider,
  title = "Las personas detrás de la experiencia",
  description = "Profesionales con años de escenario, listos para darle vida a tu celebración.",
}: {
  provider: Provider;
  title?: React.ReactNode;
  description?: string;
}) {
  const cols = provider.team.length >= 4 ? "lg:grid-cols-4" : provider.team.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2 lg:max-w-3xl";
  return (
    <section id="integrantes" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow={provider.teamTitle}
          title={title}
          description={description}
          titleClassName="font-general"
        />
        <div className={cn("mx-auto mt-14 grid gap-5 sm:grid-cols-2", cols)}>
          {provider.team.map((m, i) => (
            <MemberCard key={m.name} member={m} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
