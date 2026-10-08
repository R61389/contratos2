"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Provider } from "@/lib/providers";
import { formatLongDate, MONTHS } from "@/lib/availability";
import { freeProviders } from "@/lib/event-builder";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

/** Month grid where each day shows how much of the relevant supply is still free. */
export function DatePicker({
  today,
  value,
  onChange,
  providers,
}: {
  today: Date;
  value: Date | null;
  onChange: (d: Date) => void;
  providers: Provider[];
}) {
  const [offset, setOffset] = useState(() =>
    value ? Math.max(0, (value.getFullYear() - today.getFullYear()) * 12 + value.getMonth() - today.getMonth()) : 0
  );
  const [direction, setDirection] = useState(1);
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const lead = (month.getDay() + 6) % 7;
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const total = Math.max(1, providers.length);

  function go(delta: number) {
    setDirection(delta);
    setOffset((o) => Math.min(11, Math.max(0, o + delta)));
  }

  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="font-general text-lg font-semibold capitalize text-white">
          {MONTHS[month.getMonth()]} <span className="text-ink-mid">{month.getFullYear()}</span>
        </p>
        <div className="flex gap-2">
          {[
            { d: -1, icon: ChevronLeft, label: "Mes anterior", disabled: offset === 0 },
            { d: 1, icon: ChevronRight, label: "Mes siguiente", disabled: offset === 11 },
          ].map(({ d, icon: Icon, label, disabled }) => (
            <button
              key={label}
              type="button"
              onClick={() => go(d)}
              disabled={disabled}
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-light/15 text-ink-light transition-colors hover:border-volt hover:text-volt disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-mid">
        {WEEKDAYS.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="relative mt-2 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={offset}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -50 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-7 gap-1.5"
          >
            {Array.from({ length: lead }, (_, i) => (
              <span key={`b${i}`} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
              const past = date < today;
              const free = past ? 0 : freeProviders(providers, date);
              const ratio = free / total;
              const selected = value?.getTime() === date.getTime();
              return (
                <motion.button
                  key={i}
                  type="button"
                  disabled={past}
                  onClick={() => onChange(date)}
                  whileTap={past ? undefined : { scale: 0.92 }}
                  aria-pressed={selected}
                  aria-label={`${formatLongDate(date)}${past ? ": fecha pasada" : `: ${free} de ${providers.length} proveedores libres`}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-medium transition-all duration-200",
                    past
                      ? "cursor-not-allowed border-transparent text-ink-mid/30"
                      : "border-ink-light/10 bg-white/[0.02] text-white hover:border-volt/60",
                    selected && "border-volt bg-volt text-ink shadow-glow hover:border-volt"
                  )}
                >
                  {i + 1}
                  {!past && (
                    <span className="absolute bottom-1.5 flex gap-0.5">
                      {[0.34, 0.67, 1].map((step) => (
                        <span
                          key={step}
                          className={cn(
                            "h-1 w-1 rounded-full",
                            selected ? (ratio >= step - 0.01 ? "bg-ink" : "bg-ink/25") : ratio >= step - 0.01 ? "bg-emerald-400" : "bg-white/15"
                          )}
                        />
                      ))}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-ink-mid">
        <span className="flex gap-0.5">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
        </span>
        Más puntos, más proveedores libres para tus servicios
      </p>
    </div>
  );
}
