"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, type MotionValue } from "motion/react";
import { ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { cn } from "@/lib/utils";

const AUTOPLAY_KEY = "vibra:music-autoplay";
const BAR_COUNT = 4;

const MusicLevelContext = createContext<MotionValue<number> | null>(null);

/** 0–1 loudness of the profile's music (bass-weighted), or null when the profile has none. */
export function useMusicLevel() {
  return useContext(MusicLevelContext);
}

function readAutoplayPref() {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) !== "off";
  } catch {
    return true;
  }
}

function writeAutoplayPref(on: boolean) {
  try {
    localStorage.setItem(AUTOPLAY_KEY, on ? "on" : "off");
  } catch {}
}

function formatTime(s: number) {
  if (!Number.isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

function MusicPlayer({ provider, level }: { provider: Provider; level: MotionValue<number> }) {
  const music = provider.music!;
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const barsRef = useRef<Set<HTMLSpanElement>>(new Set());

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });

  const track = music.tracks[index];

  const registerBar = useCallback((el: HTMLSpanElement | null) => {
    if (el) barsRef.current.add(el);
  }, []);

  // The analyser reroutes audio through an AudioContext, which browsers only start
  // from a user gesture — so this must only be called from gesture handlers.
  const attachAnalyser = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (ctxRef.current) {
      void ctxRef.current.resume();
      return;
    }
    if (navigator.userActivation && !navigator.userActivation.isActive) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.78;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    ctxRef.current = ctx;
    analyserRef.current = analyser;
  }, []);

  const play = useCallback(
    async (fromGesture: boolean) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (fromGesture) attachAnalyser();
      try {
        await audio.play();
        setWaiting(false);
      } catch (err) {
        if ((err as DOMException).name === "NotAllowedError") setWaiting(true);
      }
    },
    [attachAnalyser]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      writeAutoplayPref(true);
      void play(true);
    } else {
      writeAutoplayPref(false);
      audio.pause();
    }
  }, [play]);

  const skip = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + music.tracks.length) % music.tracks.length);
      attachAnalyser();
    },
    [attachAnalyser, music.tracks.length]
  );

  // Try to start as soon as the profile opens; browsers usually block audible autoplay,
  // in which case the first click or key press anywhere on the page starts it.
  useEffect(() => {
    if (!readAutoplayPref()) return;
    void play(false);
  }, [play]);

  useEffect(() => {
    function onFirstGesture(e: Event) {
      const target = e.target as Element | null;
      if (target?.closest("[data-music-player]")) return;
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused && readAutoplayPref()) void play(true);
      else if (!audio.paused) attachAnalyser();
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    }
    window.addEventListener("pointerdown", onFirstGesture);
    window.addEventListener("keydown", onFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [play, attachAnalyser]);

  // Changing track keeps playback going if it was already playing.
  const wasPlaying = useRef(false);
  useEffect(() => {
    wasPlaying.current = playing;
  }, [playing]);
  const firstTrack = useRef(true);
  useEffect(() => {
    if (firstTrack.current) {
      firstTrack.current = false;
      return;
    }
    setUnavailable(false);
    if (wasPlaying.current) void play(true);
  }, [index, play]);

  // Visualiser loop: drives the shared level (hero glow) and the equalizer bars.
  useEffect(() => {
    let raf = 0;
    let smooth = level.get();
    const data = new Uint8Array(128);
    const loop = (t: number) => {
      const analyser = analyserRef.current;
      barsRef.current.forEach((b) => !b.isConnected && barsRef.current.delete(b));
      const bars = Array.from(barsRef.current);
      let target = 0;
      const heights: number[] = [];
      if (playing && analyser) {
        analyser.getByteFrequencyData(data);
        let bass = 0;
        for (let i = 1; i < 10; i++) bass += data[i];
        target = Math.min(1, bass / (9 * 255) * 1.25);
        for (let b = 0; b < BAR_COUNT; b++) {
          const from = 2 + b * 8;
          let sum = 0;
          for (let i = from; i < from + 8; i++) sum += data[i];
          heights.push(Math.max(0.15, sum / (8 * 255)));
        }
      } else if (playing) {
        // Before a gesture has allowed the analyser, fake a ~120 bpm pulse.
        target = 0.35 + 0.3 * Math.max(0, Math.sin((t / 1000) * Math.PI * 4));
        for (let b = 0; b < BAR_COUNT; b++) heights.push(0.3 + 0.6 * Math.abs(Math.sin(t / (180 + b * 70) + b)));
      }
      smooth += (target - smooth) * (playing ? 0.35 : 0.08);
      level.set(smooth);
      bars.forEach((bar, i) => {
        bar.style.transform = `scaleY(${playing ? heights[i % BAR_COUNT] ?? 0.2 : 0.2})`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, level]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      audio?.pause();
      void ctxRef.current?.close();
    };
  }, []);

  // Full card over the hero; shrink to the compact pill once the visitor scrolls into the content.
  useEffect(() => {
    function onScroll() {
      if (window.scrollY > window.innerHeight * 0.8) {
        setCollapsed(true);
        window.removeEventListener("scroll", onScroll);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !time.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * time.duration;
  }

  const progress = time.duration ? time.current / time.duration : 0;
  const status = unavailable ? "Audio no disponible" : waiting ? "Toca para escuchar" : playing ? "Sonando ahora" : "En pausa";

  const equalizer = (className?: string) => (
    <span className={cn("flex h-3 items-end gap-[2px]", className)} aria-hidden>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span key={i} ref={registerBar} className="h-full w-[3px] origin-bottom rounded-full bg-volt transition-transform duration-75" style={{ transform: "scaleY(0.2)" }} />
      ))}
    </span>
  );

  const playButton = (size: "sm" | "lg") => (
    <button
      type="button"
      onClick={toggle}
      aria-label={playing ? "Pausar música" : "Reproducir música"}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-volt text-ink shadow-glow transition-transform duration-200 hover:scale-105 active:scale-95",
        size === "lg" ? "h-11 w-11" : "h-9 w-9"
      )}
    >
      {waiting && <span className="absolute inset-0 animate-ping rounded-full bg-volt/50" />}
      {playing ? <Pause className="relative h-4 w-4 fill-ink" /> : <Play className="relative ml-0.5 h-4 w-4 fill-ink" />}
    </button>
  );

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload="auto"
        loop={music.tracks.length === 1}
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => skip(1)}
        onTimeUpdate={(e) => setTime({ current: e.currentTarget.currentTime, duration: e.currentTarget.duration })}
        onLoadedMetadata={(e) => setTime({ current: 0, duration: e.currentTarget.duration })}
        onError={() => {
          setUnavailable(true);
          setWaiting(false);
        }}
      />

      {/* Desktop: Spotify-style now-playing card */}
      <motion.div
        data-music-player
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-5 left-5 z-40 hidden md:block"
        role="region"
        aria-label={`Música de ${provider.fullName}`}
      >
        <div className={cn("glass-strong rounded-2xl shadow-card transition-[width] duration-500", collapsed ? "w-[250px] p-2" : "w-[360px] p-3")}>
          <div className="flex items-center gap-3">
            <div className={cn("relative shrink-0 overflow-hidden rounded-xl", collapsed ? "h-10 w-10" : "h-14 w-14")}>
              <Image src={music.cover} alt="" fill sizes="56px" className="object-cover" />
              {playing && <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-volt/60" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]", waiting ? "text-volt" : "text-ink-mid")}>
                {equalizer()}
                {!collapsed && (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={status} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="truncate">
                      {status}
                    </motion.span>
                  </AnimatePresence>
                )}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold text-white">{track.title}</p>
              {!collapsed && <p className="truncate text-xs text-ink-mid">{track.artist ?? provider.fullName}</p>}
            </div>
            {playButton(collapsed ? "sm" : "lg")}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expandir reproductor" : "Minimizar reproductor"}
              className="flex h-8 w-6 shrink-0 items-center justify-center text-ink-mid transition-colors hover:text-white"
            >
              {collapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex items-center gap-2 text-[10px] tabular-nums text-ink-mid">
                  <span>{formatTime(time.current)}</span>
                  <div
                    role="slider"
                    aria-label="Progreso de la canción"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(time.duration || 0)}
                    aria-valuenow={Math.round(time.current)}
                    tabIndex={0}
                    onClick={seek}
                    onKeyDown={(e) => {
                      const audio = audioRef.current;
                      if (!audio) return;
                      if (e.key === "ArrowRight") audio.currentTime = Math.min(time.duration, audio.currentTime + 5);
                      if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 5);
                    }}
                    className="group relative h-4 flex-1 cursor-pointer"
                  >
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-volt" style={{ width: `${progress * 100}%` }} />
                    </div>
                    <div
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                      style={{ left: `${progress * 100}%` }}
                    />
                  </div>
                  <span>{formatTime(time.duration)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => skip(-1)} aria-label="Canción anterior" disabled={music.tracks.length < 2} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white disabled:opacity-30">
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => skip(1)} aria-label="Siguiente canción" disabled={music.tracks.length < 2} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white disabled:opacity-30">
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-ink-mid">
                    {index + 1} / {music.tracks.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? "Activar sonido" : "Silenciar"}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white"
                  >
                    {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile: spinning record button above the booking bar */}
      <motion.div
        data-music-player
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 1.6 }}
        className="fixed bottom-24 right-4 z-40 flex items-center gap-2 md:hidden"
      >
        <AnimatePresence>
          {waiting && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="glass-strong rounded-full px-3 py-1.5 text-xs font-medium text-white"
            >
              Toca para escuchar
            </motion.span>
          )}
        </AnimatePresence>
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pausar música" : "Reproducir música"}
          className="relative h-14 w-14 rounded-full p-[3px] shadow-glow"
          style={{ background: `conic-gradient(#E2E800 ${progress * 360}deg, rgba(214,214,214,0.15) 0deg)` }}
        >
          {waiting && <span className="absolute inset-0 animate-ping rounded-full bg-volt/40" />}
          <motion.span
            animate={playing ? { rotate: 360 } : { rotate: 0 }}
            transition={playing ? { duration: 6, repeat: Infinity, ease: "linear" } : { duration: 0.4 }}
            className="relative block h-full w-full overflow-hidden rounded-full"
          >
            <Image src={music.cover} alt="" fill sizes="56px" className="object-cover" />
          </motion.span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-volt">
              {playing ? equalizer("h-2.5") : <Play className="ml-0.5 h-3 w-3 fill-volt" />}
            </span>
          </span>
        </button>
      </motion.div>
    </>
  );
}

export function ProviderMusic({ provider, children }: { provider: Provider; children: React.ReactNode }) {
  const level = useMotionValue(0);
  return (
    <MusicLevelContext.Provider value={provider.music ? level : null}>
      {children}
      {provider.music && <MusicPlayer provider={provider} level={level} />}
    </MusicLevelContext.Provider>
  );
}
