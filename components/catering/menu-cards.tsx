"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useMotionValue } from "motion/react";
import { ArrowUpRight, Clock, Users } from "lucide-react";
import type { CateringMenu, Provider } from "@/lib/providers";
import { formatBs } from "@/lib/format";
import { SectionHeading } from "@/components/ui/section-heading";
import { usePlanner } from "@/components/catering/planner";
import { cn } from "@/lib/utils";

function MenuCard({ menu, index, onSelect }: { menu: CateringMenu; index: number; onSelect: () => void }) {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}% ${my}%, rgba(226,232,0,0.16), transparent 55%)`;

  function onMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width) * 100);
    my.set(((e.clientY - rect.top) / rect.height) * 100);
  }

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      onMouseMove={onMove}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8 }}
      aria-label={`Ver el ${menu.name}: ${formatBs(menu.pricePerPerson)} por persona`}
      className={cn(
        "group relative block w-full overflow-hidden rounded-[2rem] text-left shadow-card ring-1 ring-inset ring-white/10 transition-shadow duration-500 hover:shadow-glow",
        index === 0 || index === 3 ? "aspect-[4/5] lg:aspect-[4/5.6]" : "aspect-[4/5]"
      )}
    >
      <Image
        src={menu.image}
        alt=""
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.08]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
      <motion.span style={{ background: spotlight }} className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-transparent transition-all duration-500 group-hover:ring-volt/50" />

      <span className="absolute inset-x-5 top-5 flex items-start justify-between">
        {menu.badge ? (
          <span className="rounded-full bg-volt px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">{menu.badge}</span>
        ) : (
          <span />
        )}
        <span className="glass flex h-11 w-11 items-center justify-center rounded-full text-white transition-all duration-500 group-hover:rotate-45 group-hover:border-volt group-hover:bg-volt group-hover:text-ink">
          <ArrowUpRight className="h-5 w-5" />
        </span>
      </span>

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 sm:p-7">
        <span>
          <span className="block font-serif text-4xl leading-none text-white sm:text-[2.6rem]">{menu.name}</span>
          <span className="mt-3 block max-h-0 overflow-hidden text-sm text-ink-light/85 opacity-0 transition-all duration-500 group-hover:max-h-16 group-hover:opacity-100">
            {menu.tagline}
          </span>
        </span>
        <span className="flex items-end justify-between gap-4 border-t border-white/15 pt-4">
          <span>
            <span className="block font-general text-3xl font-semibold tracking-tight text-volt">
              {formatBs(menu.pricePerPerson)}
            </span>
            <span className="text-xs uppercase tracking-wider text-ink-mid">por persona</span>
          </span>
          <span className="flex flex-col items-end gap-1.5 text-xs text-ink-light">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-volt" />
              Mín. {menu.minGuests} invitados
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-volt" />
              {menu.serviceTime} de servicio
            </span>
          </span>
        </span>
      </span>
    </motion.button>
  );
}

export function MenuCards({ provider }: { provider: Provider }) {
  const { setMenuId } = usePlanner();
  const menus = provider.catering!.menus;

  function select(id: string) {
    setMenuId(id);
    document.getElementById("carta")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="menus" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Menús destacados"
          title={
            <>
              Una carta para cada <span className="font-serif font-normal italic text-volt">celebración</span>
            </>
          }
          description="Desde un coffee break impecable hasta una cena de gala de seis tiempos. Elige un menú para ver cada plato."
          titleClassName="font-general"
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
          {menus.map((m, i) => (
            <div key={m.id} className={cn(i % 3 === 1 && "lg:mt-16")}>
              <MenuCard menu={m} index={i} onSelect={() => select(m.id)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
