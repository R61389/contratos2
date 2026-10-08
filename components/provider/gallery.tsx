"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import type { GalleryItem, GalleryTag, Provider } from "@/lib/providers";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";


function Lightbox({
  items,
  index,
  onClose,
  onChange,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [direction, setDirection] = useState(0);
  const item = items[index];

  const go = useCallback(
    (delta: number) => {
      setDirection(delta);
      onChange((index + delta + items.length) % items.length);
    },
    [index, items.length, onChange]
  );

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Galería ampliada"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-2xl sm:p-10"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Cerrar galería"
        className="glass absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full text-white transition-colors hover:border-volt hover:text-volt sm:right-8 sm:top-8"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative flex h-full w-full max-w-6xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.figure
            key={item.src}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -80, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80) go(1);
              else if (info.offset.x > 80) go(-1);
            }}
            className="flex max-h-full flex-col items-center gap-4"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-card">
              <Image
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                sizes="(max-width: 1024px) 100vw, 1100px"
                className="h-auto max-h-[78svh] w-auto object-contain"
                draggable={false}
              />
            </div>
            <figcaption className="flex items-center gap-3 text-sm text-ink-light">
              <span className="rounded-full border border-volt/30 bg-volt/10 px-2.5 py-0.5 text-xs font-semibold text-volt">
                {item.tag}
              </span>
              {item.alt}
              <span className="text-ink-mid">
                {index + 1} / {items.length}
              </span>
            </figcaption>
          </motion.figure>
        </AnimatePresence>

        <button
          onClick={() => go(-1)}
          aria-label="Foto anterior"
          className="glass absolute left-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors hover:border-volt hover:text-volt sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Foto siguiente"
          className="glass absolute right-0 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white transition-colors hover:border-volt hover:text-volt sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}

export function Gallery({
  provider,
  eyebrow = "Galería",
  title = "Cada evento, una historia",
  description = "Fotos reales de escenarios, celebraciones y del público que vivió la experiencia.",
}: {
  provider: Provider;
  eyebrow?: string;
  title?: React.ReactNode;
  description?: string;
}) {
  const filters: ("Todos" | GalleryTag)[] = ["Todos", ...new Set(provider.gallery.map((g) => g.tag))];
  const [filter, setFilter] = useState<"Todos" | GalleryTag>("Todos");
  const [open, setOpen] = useState<number | null>(null);
  const items = filter === "Todos" ? provider.gallery : provider.gallery.filter((g) => g.tag === filter);

  return (
    <section id="galeria" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            align="left"
            eyebrow={eyebrow}
            title={title}
            description={description}
            titleClassName="font-general"
          />
          <div className="scrollbar-none -mx-6 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:shrink-0 lg:overflow-visible lg:px-0" role="tablist" aria-label="Filtrar galería">
            {filters.map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300",
                  filter === f ? "text-ink" : "text-ink-light hover:text-white"
                )}
              >
                {filter === f && (
                  <motion.span
                    layoutId="gallery-filter"
                    className="absolute inset-0 rounded-full bg-volt"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative">{f}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="mt-12 columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4">
          <AnimatePresence mode="popLayout">
            {items.map((item, i) => (
              <motion.button
                layout
                key={item.src}
                type="button"
                onClick={() => setOpen(i)}
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: (i % 4) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                aria-label={`Ampliar: ${item.alt}`}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-2xl sm:mb-4"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/0 to-ink/0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 transition-all duration-500 group-hover:ring-volt/50" />
                <span className="absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-between opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="rounded-full bg-volt px-2.5 py-0.5 text-[11px] font-semibold text-ink">{item.tag}</span>
                  <span className="glass flex h-8 w-8 items-center justify-center rounded-full text-white">
                    <Maximize2 className="h-3.5 w-3.5" />
                  </span>
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {open !== null && items[open] && (
          <Lightbox items={items} index={open} onClose={() => setOpen(null)} onChange={setOpen} />
        )}
      </AnimatePresence>
    </section>
  );
}
