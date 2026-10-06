"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "motion/react";
import { Star, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { PROVIDERS } from "@/lib/providers";
import { formatBs } from "@/lib/format";
import { cn } from "@/lib/utils";

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
                key={p.slug}
                className="min-w-0 shrink-0 grow-0 basis-[80%] pl-4 sm:basis-[45%] lg:basis-[30%]"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                  className="h-full"
                >
                  <Link
                    href={`/proveedores/${p.slug}`}
                    className="glass group flex h-full flex-col overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={p.heroImage}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 30vw"
                        className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
                      <Image
                        src={p.subject.src}
                        alt={p.subject.alt}
                        width={p.subject.width}
                        height={p.subject.height}
                        sizes="320px"
                        className="absolute bottom-0 left-1/2 h-[88%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-medium text-ink-light backdrop-blur">
                        {p.category}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h3 className="flex items-center justify-between gap-2 font-medium text-white">
                        {p.fullName}
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-mid transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-volt" />
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-volt">
                          <Star className="h-4 w-4 fill-volt" />
                          {p.rating.toFixed(1)}
                        </span>
                        <span className="text-ink-mid">
                          Desde {formatBs(p.price.from)}
                          {p.price.unit ? ` ${p.price.unit}` : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
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
