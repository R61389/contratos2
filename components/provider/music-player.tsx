"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValue, type MotionValue } from "motion/react";
import { ChevronDown, ChevronUp, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { Provider, Track } from "@/lib/providers";
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

/** Drives the shared level and the equalizer bars; uses real frequency data when an analyser is available. */
function useVisualizer(playing: boolean, level: MotionValue<number>, analyserRef?: React.RefObject<AnalyserNode | null>) {
  const barsRef = useRef<Set<HTMLSpanElement>>(new Set());
  const registerBar = useCallback((el: HTMLSpanElement | null) => {
    if (el) barsRef.current.add(el);
  }, []);

  useEffect(() => {
    let raf = 0;
    let smooth = level.get();
    const data = new Uint8Array(128);
    const loop = (t: number) => {
      const analyser = analyserRef?.current;
      barsRef.current.forEach((b) => !b.isConnected && barsRef.current.delete(b));
      let target = 0;
      const heights: number[] = [];
      if (playing && analyser) {
        analyser.getByteFrequencyData(data);
        let bass = 0;
        for (let i = 1; i < 10; i++) bass += data[i];
        target = Math.min(1, (bass / (9 * 255)) * 1.25);
        for (let b = 0; b < BAR_COUNT; b++) {
          let sum = 0;
          for (let i = 2 + b * 8; i < 10 + b * 8; i++) sum += data[i];
          heights.push(Math.max(0.15, sum / (8 * 255)));
        }
      } else if (playing) {
        // No access to the signal (cross-origin embed, or no gesture yet): a ~120 bpm pulse.
        target = 0.35 + 0.3 * Math.max(0, Math.sin((t / 1000) * Math.PI * 4));
        for (let b = 0; b < BAR_COUNT; b++) heights.push(0.3 + 0.6 * Math.abs(Math.sin(t / (180 + b * 70) + b)));
      }
      smooth += (target - smooth) * (playing ? 0.35 : 0.08);
      level.set(smooth);
      Array.from(barsRef.current).forEach((bar, i) => {
        bar.style.transform = `scaleY(${playing ? heights[i % BAR_COUNT] ?? 0.2 : 0.2})`;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, level, analyserRef]);

  return registerBar;
}

function Equalizer({ register, className }: { register: (el: HTMLSpanElement | null) => void; className?: string }) {
  return (
    <span className={cn("flex h-3 items-end gap-[2px]", className)} aria-hidden>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <span key={i} ref={register} className="h-full w-[3px] origin-bottom rounded-full bg-volt transition-transform duration-75" style={{ transform: "scaleY(0.2)" }} />
      ))}
    </span>
  );
}

function PlayButton({ playing, waiting, onClick, size }: { playing: boolean; waiting: boolean; onClick: () => void; size: "sm" | "lg" }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
}

function ProgressBar({ current, duration, onSeek }: { current: number; duration: number; onSeek: (seconds: number) => void }) {
  const progress = duration ? current / duration : 0;
  return (
    <div className="flex items-center gap-2 text-[10px] tabular-nums text-ink-mid">
      <span>{formatTime(current)}</span>
      <div
        role="slider"
        aria-label="Progreso de la canción"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration || 0)}
        aria-valuenow={Math.round(current)}
        tabIndex={0}
        onClick={(e) => {
          if (!duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          onSeek(((e.clientX - rect.left) / rect.width) * duration);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onSeek(Math.min(duration, current + 5));
          if (e.key === "ArrowLeft") onSeek(Math.max(0, current - 5));
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
      <span>{formatTime(duration)}</span>
    </div>
  );
}

/** Starts playback on the first click or key press anywhere outside the player, once. */
function useFirstGesture(onGesture: () => void) {
  const handler = useRef(onGesture);
  useEffect(() => {
    handler.current = onGesture;
  });
  useEffect(() => {
    function onFirst(e: Event) {
      if ((e.target as Element | null)?.closest("[data-music-player]")) return;
      handler.current();
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    }
    window.addEventListener("pointerdown", onFirst);
    window.addEventListener("keydown", onFirst);
    return () => {
      window.removeEventListener("pointerdown", onFirst);
      window.removeEventListener("keydown", onFirst);
    };
  }, []);
}

/* ------------------------------------------------------------------ */
/* Audio files the provider owns: full player with a real visualiser. */
/* ------------------------------------------------------------------ */

function FileMusicPlayer({
  provider,
  tracks,
  cover,
  level,
}: {
  provider: Provider;
  tracks: (Track & { src: string })[];
  cover: string;
  level: MotionValue<number>;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });

  const track = tracks[index];
  const registerBar = useVisualizer(playing, level, analyserRef);

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
      setIndex((i) => (i + delta + tracks.length) % tracks.length);
      attachAnalyser();
    },
    [attachAnalyser, tracks.length]
  );

  // Try to start as soon as the profile opens; browsers usually block audible autoplay,
  // in which case the first click or key press anywhere on the page starts it.
  useEffect(() => {
    if (readAutoplayPref()) void play(false);
  }, [play]);

  useFirstGesture(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused && readAutoplayPref()) void play(true);
    else if (!audio.paused) attachAnalyser();
  });

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

  const progress = time.duration ? time.current / time.duration : 0;
  const status = unavailable ? "Audio no disponible" : waiting ? "Toca para escuchar" : playing ? "Sonando ahora" : "En pausa";

  return (
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload="auto"
        loop={tracks.length === 1}
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
              <Image src={cover} alt="" fill sizes="56px" className="object-cover" />
              {playing && <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-volt/60" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]", waiting ? "text-volt" : "text-ink-mid")}>
                <Equalizer register={registerBar} />
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
            <PlayButton playing={playing} waiting={waiting} onClick={toggle} size={collapsed ? "sm" : "lg"} />
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
                <div className="mt-3">
                  <ProgressBar
                    current={time.current}
                    duration={time.duration}
                    onSeek={(s) => {
                      if (audioRef.current) audioRef.current.currentTime = s;
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => skip(-1)} aria-label="Canción anterior" disabled={tracks.length < 2} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white disabled:opacity-30">
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => skip(1)} aria-label="Siguiente canción" disabled={tracks.length < 2} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white disabled:opacity-30">
                      <SkipForward className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-ink-mid">
                    {index + 1} / {tracks.length}
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
            <Image src={cover} alt="" fill sizes="56px" className="object-cover" />
          </motion.span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-volt">
              {playing ? <Equalizer register={registerBar} className="h-2.5" /> : <Play className="ml-0.5 h-3 w-3 fill-volt" />}
            </span>
          </span>
        </button>
      </motion.div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Official songs from YouTube, through the IFrame Player API.         */
/* YouTube's embed rules require the player to stay visible and at     */
/* least 200×200 px while it plays, so the video shows whenever music  */
/* is playing and the card only shrinks while paused.                  */
/* ------------------------------------------------------------------ */

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  loadVideoById(id: string): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (el: HTMLElement, options: Record<string, unknown>) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApi: Promise<YTNamespace> | null = null;

// Ad blockers often block YouTube's script, so loading fails (and can be retried) instead of hanging.
function loadYouTubeApi() {
  youtubeApi ??= new Promise<YTNamespace>((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const script = document.createElement("script");
    const fail = () => {
      window.clearTimeout(timer);
      script.remove();
      youtubeApi = null;
      reject(new Error("YouTube API unavailable"));
    };
    const timer = window.setTimeout(fail, 15000);
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      previous?.();
      resolve(window.YT!);
    };
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return youtubeApi;
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

function YouTubeMusicPlayer({
  provider,
  tracks,
  level,
}: {
  provider: Provider;
  tracks: (Track & { youtubeId: string })[];
  level: MotionValue<number>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const readyRef = useRef(false);
  const wantPlay = useRef(false);
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"idle" | "starting" | "playing" | "paused">("idle");
  const [stalled, setStalled] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState({ current: 0, duration: 0 });

  const track = tracks[index];
  const playing = phase === "playing";
  const registerBar = useVisualizer(playing, level);

  const start = useCallback(() => {
    wantPlay.current = true;
    setPhase((p) => (p === "playing" ? p : "starting"));
    if (readyRef.current) playerRef.current?.playVideo();
  }, []);

  const toggle = useCallback(() => {
    if (playing) {
      writeAutoplayPref(false);
      wantPlay.current = false;
      playerRef.current?.pauseVideo();
    } else {
      writeAutoplayPref(true);
      start();
    }
  }, [playing, start]);

  const skip = useCallback(
    (delta: number) => {
      const next = (indexRef.current + delta + tracks.length) % tracks.length;
      indexRef.current = next;
      setIndex(next);
      wantPlay.current = true;
      setPhase((p) => (p === "playing" ? p : "starting"));
      if (readyRef.current) playerRef.current?.loadVideoById(tracks[next].youtubeId);
    },
    [tracks]
  );

  // If a requested start hasn't begun after a few seconds, the browser wants a tap on the video itself.
  useEffect(() => {
    setStalled(false);
    if (phase !== "starting") return;
    const id = window.setTimeout(() => setStalled(true), 3000);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    // A fresh mount node each time: the API replaces it with the iframe.
    const mount = document.createElement("div");
    container.appendChild(mount);

    void loadYouTubeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player(mount, {
        host: "https://www.youtube-nocookie.com",
        videoId: tracks[0].youtubeId,
        width: "100%",
        height: "100%",
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
        events: {
          onReady: () => {
            readyRef.current = true;
            setReady(true);
            // Arriving from another page of the site counts as prior interaction, so it can start right away.
            const activated = navigator.userActivation?.hasBeenActive ?? false;
            if (wantPlay.current || (activated && readAutoplayPref())) start();
          },
          onStateChange: (e: { data: number }) => {
            setBuffering(e.data === YT_BUFFERING);
            if (e.data === YT_PLAYING) {
              setPhase("playing");
              setFailed(false);
            } else if (e.data === YT_PAUSED) {
              wantPlay.current = false;
              setPhase("paused");
            } else if (e.data === YT_ENDED) {
              if (tracks.length > 1) skip(1);
              else {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              }
            }
          },
          onError: () => setFailed(true),
        },
      });
    }, () => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
      readyRef.current = false;
      playerRef.current?.destroy();
      playerRef.current = null;
      container.replaceChildren();
    };
    // The player is created once per profile; track changes go through loadVideoById.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFirstGesture(() => {
    if (phase === "idle" && readAutoplayPref()) start();
  });

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (p) setTime({ current: p.getCurrentTime(), duration: p.getDuration() });
    }, 500);
    return () => window.clearInterval(id);
  }, [playing]);

  const showVideo = !failed && (phase === "playing" || phase === "starting");
  const waiting = ready && phase === "idle";
  const status = failed
    ? "YouTube no cargó"
    : {
        idle: "Toca para escuchar",
        starting: stalled && !buffering ? "Toca el video para reproducir" : "Cargando…",
        playing: "Sonando ahora",
        paused: "En pausa",
      }[phase];
  const watchUrl = `https://www.youtube.com/watch?v=${track.youtubeId}`;

  return (
    <motion.div
      data-music-player
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
      role="region"
      aria-label={`Música de ${provider.fullName}`}
      className={cn(
        "fixed bottom-24 z-40 md:bottom-5 md:left-5 md:right-auto md:w-[380px]",
        showVideo ? "inset-x-3" : "right-3 w-[300px]"
      )}
    >
      <div className={cn("glass-strong rounded-2xl shadow-card", showVideo ? "p-2 md:p-3" : "p-2")}>
        <div
          className={cn(
            "overflow-hidden rounded-xl bg-black transition-[height,margin] duration-500",
            showVideo ? "mb-3 h-[200px]" : "mb-0 h-0"
          )}
        >
          <div ref={containerRef} className="h-[200px] w-full" />
        </div>

        <div className="flex items-center gap-3">
          {!showVideo && (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
              <Image src={`https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`} alt="" fill sizes="44px" className="object-cover" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em]", waiting ? "text-volt" : "text-ink-mid")}>
              <Equalizer register={registerBar} />
              <span className="truncate">{status}</span>
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-white">{track.title}</p>
            <p className="truncate text-xs text-ink-mid">{track.artist ?? provider.fullName} · Video oficial</p>
          </div>
          {tracks.length > 1 && showVideo && (
            <button type="button" onClick={() => skip(-1)} aria-label="Canción anterior" className="hidden h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white sm:flex">
              <SkipBack className="h-4 w-4" />
            </button>
          )}
          {failed ? (
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-volt px-4 text-xs font-semibold text-ink shadow-glow"
            >
              <Play className="h-3.5 w-3.5 fill-ink" />
              Abrir en YouTube
            </a>
          ) : (
            <PlayButton playing={playing} waiting={waiting} onClick={toggle} size="lg" />
          )}
          {tracks.length > 1 && !failed && (
            <button type="button" onClick={() => skip(1)} aria-label="Siguiente canción" className="flex h-8 w-8 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white">
              <SkipForward className="h-4 w-4" />
            </button>
          )}
        </div>

        {showVideo && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <ProgressBar current={time.current} duration={time.duration} onSeek={(s) => playerRef.current?.seekTo(s, true)} />
            </div>
            <button
              type="button"
              onClick={() => {
                if (muted) playerRef.current?.unMute();
                else playerRef.current?.mute();
                setMuted(!muted);
              }}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-light transition-colors hover:text-white"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function isYouTube(t: Track): t is Track & { youtubeId: string } {
  return typeof t.youtubeId === "string";
}

function isFile(t: Track): t is Track & { src: string } {
  return typeof t.src === "string";
}

export function ProviderMusic({ provider, children }: { provider: Provider; children: React.ReactNode }) {
  const level = useMotionValue(0);
  const music = provider.music;
  const youtube = music?.tracks.filter(isYouTube) ?? [];
  const files = music?.tracks.filter(isFile) ?? [];

  return (
    <MusicLevelContext.Provider value={music ? level : null}>
      {children}
      {music && youtube.length > 0 && <YouTubeMusicPlayer provider={provider} tracks={youtube} level={level} />}
      {music && youtube.length === 0 && files.length > 0 && (
        <FileMusicPlayer provider={provider} tracks={files} cover={music.cover} level={level} />
      )}
    </MusicLevelContext.Provider>
  );
}
