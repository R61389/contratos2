"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Play, Volume2 } from "lucide-react";
import type { Provider, VideoItem } from "@/lib/providers";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

function Equalizer() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-volt"
          animate={{ height: ["30%", "100%", "45%", "80%", "30%"] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

function VideoCard({ video, index }: { video: VideoItem; index: number }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // Clips are only fetched on first hover/tap so the section doesn't download every video up front.
    if (!el.getAttribute("src")) el.src = video.src;
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [video.src]);

  const stop = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: (index % 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      onPointerEnter={(e) => e.pointerType === "mouse" && play()}
      onPointerLeave={(e) => e.pointerType === "mouse" && stop()}
      className="group relative transition-transform duration-500 ease-out hover:z-10 hover:scale-[1.04]"
    >
      <button
        type="button"
        onClick={() => (playing ? stop() : play())}
        aria-label={`${playing ? "Pausar" : "Reproducir"}: ${video.title}`}
        className="relative block aspect-video w-full overflow-hidden rounded-2xl bg-ink-dark/40 text-left shadow-card ring-1 ring-white/10 transition-shadow duration-500 group-hover:shadow-glow group-hover:ring-volt/40"
      >
        <Image
          src={video.poster}
          alt=""
          fill
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
          className={cn("object-cover transition-all duration-700", playing ? "scale-105 opacity-0" : "opacity-100")}
        />
        <video
          ref={ref}
          muted
          loop
          playsInline
          preload="none"
          className={cn("absolute inset-0 h-full w-full object-cover transition-opacity duration-500", playing ? "opacity-100" : "opacity-0")}
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />

        <span
          className={cn(
            "absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-volt text-ink shadow-glow transition-all duration-500",
            playing ? "scale-75 opacity-0" : "scale-100 opacity-100 group-hover:scale-110"
          )}
        >
          <Play className="ml-0.5 h-5 w-5 fill-ink" />
        </span>

        <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          EN VIVO
        </span>

        <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <span>
            <span className="block font-general text-lg font-semibold text-white">{video.title}</span>
            <span className="block text-xs text-ink-light/80">{video.subtitle}</span>
          </span>
          {playing ? <Equalizer /> : <Volume2 className="h-4 w-4 text-ink-light/60" />}
        </span>
      </button>
    </motion.div>
  );
}

export function Videos({ provider }: { provider: Provider }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on("select", update).on("reInit", update).on("scroll", update);
    return () => {
      emblaApi.off("select", update).off("reInit", update).off("scroll", update);
    };
  }, [emblaApi]);

  return (
    <section id="videos" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Videos"
            title="Míralo en acción"
            description="Pasa el cursor sobre un video para verlo en vivo."
            titleClassName="font-general"
          />
          <div className="flex gap-2">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!canPrev}
              aria-label="Videos anteriores"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt disabled:opacity-30 disabled:hover:border-ink-light/15 disabled:hover:text-ink-light"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              disabled={!canNext}
              aria-label="Más videos"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt disabled:opacity-30 disabled:hover:border-ink-light/15 disabled:hover:text-ink-light"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl overflow-hidden px-6 py-6" ref={emblaRef}>
        <div className="-ml-4 flex">
          {provider.videos.map((video, i) => (
            <div key={video.src} className="min-w-0 shrink-0 grow-0 basis-[85%] pl-4 sm:basis-[55%] lg:basis-[38%]">
              <VideoCard video={video} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
