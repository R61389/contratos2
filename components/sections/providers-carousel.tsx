"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "motion/react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const PROVIDERS = [
  { name: "Grupo Musical Eclipse", category: "Grupo Musical", rating: 4.9, price: "Bs 2,500", emoji: "🎸" },
  { name: "Grupo Musical Fusión", category: "Grupo Musical", rating: 4.8, price: "Bs 2,200", emoji: "🎺" },
  { name: "DJ NightFlow", category: "DJ", rating: 5.0, price: "Bs 1,800", emoji: "🎧" },
  { name: "DJ ElectroWave", category: "DJ", rating: 4.7, price: "Bs 1,600", emoji: "🎛️" },
  { name: "Catering Gourmet", category: "Catering", rating: 4.9, price: "Bs 90 / persona", emoji: "🍽️" },
  { name: "Catering Premium", category: "Catering", rating: 4.8, price: "Bs 120 / persona", emoji: "🥘" },
  { name: "Cervecería Andes Craft", category: "Bebidas", rating: 4.9, price: "Bs 25 / unidad", emoji: "🍺" },
  { name: "Cervecería Valle Beer", category: "Bebidas", rating: 4.6, price: "Bs 22 / unidad", emoji: "🍻" },
];

export function ProvidersCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false },
    [Autoplay({ delay: 3200, stopOnInteraction: false, stopOnMouseEnter: true })]
  );
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  return (
    <section id="proveedores" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Proveedores"
            title="Conoce a los favoritos de la comunidad"
            description="Los mejores proveedores de Cochabamba, calificados y verificados por cientos de eventos."
            className="sm:text-left"
          />
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="-ml-4 flex">
            {PROVIDERS.map((p, i) => (
              <div
                key={p.name}
                className="min-w-0 shrink-0 grow-0 basis-[80%] pl-4 sm:basis-[45%] lg:basis-[30%]"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  className="glass group flex h-full flex-col overflow-hidden rounded-2xl shadow-card transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow"
                >
                  <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-white/5 to-transparent text-6xl">
                    {p.emoji}
                    <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-ink-light backdrop-blur">
                      {p.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="font-medium text-white">{p.name}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-volt">
                        <Star className="h-4 w-4 fill-volt" />
                        {p.rating.toFixed(1)}
                      </span>
                      <span className="text-ink-mid">{p.price}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {PROVIDERS.map((_, i) => (
            <button
              key={i}
              onClick={() => emblaApi?.scrollTo(i)}
              aria-label={`Ir al proveedor ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === selected ? "w-6 bg-volt" : "w-1.5 bg-ink-light/20"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
